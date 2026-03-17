import os
import re
from dotenv import load_dotenv
from langgraph.prebuilt import create_react_agent
# Import the 5 tools
from agent.tools.get_schema import get_schema
from agent.tools.execute_query import execute_query
from agent.tools.generate_chart import generate_chart
from agent.tools.generate_flowchart import generate_flowchart
from agent.tools.explain_data import explain_data

load_dotenv()


def _build_llm():
    """Builds an LLM client based on env configuration.

    Priority:
    1) Gemini when GEMINI_API_KEY is present (or LLM_PROVIDER=gemini)
    2) Ollama fallback for local usage
    """
    provider = os.getenv("LLM_PROVIDER", "auto").lower()
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    if provider in ("auto", "gemini") and gemini_api_key:
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
            google_api_key=gemini_api_key,
            temperature=0,
        )

    if provider == "gemini" and not gemini_api_key:
        raise ValueError("LLM_PROVIDER=gemini but GEMINI_API_KEY is missing.")

    from langchain_ollama import ChatOllama

    return ChatOllama(
        model=os.getenv("OLLAMA_MODEL", "llama3.1:8b"),
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        temperature=0,
        num_ctx=8192,
    )


def _build_gemini_llm(model_name: str):
    from langchain_google_genai import ChatGoogleGenerativeAI

    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY is missing.")

    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=gemini_api_key,
        temperature=0,
    )


def _build_ollama_llm():
    from langchain_ollama import ChatOllama

    return ChatOllama(
        model=os.getenv("OLLAMA_MODEL", "llama3.1:8b"),
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        temperature=0,
        num_ctx=8192,
    )

# 1. Package the tools into a list for the agent
tools = [
    get_schema,
    execute_query,
    generate_chart,
    generate_flowchart,
    explain_data
]

# 2. System prompt for DataGod Health
system_instructions = """You are DataGod Health, an expert medical data analyst AI.
You help hospital staff query patient data, generate visualizations,
and understand health trends using natural language.

IMPORTANT RULES:
1. ALWAYS call get_schema first if you don't know the database structure
2. ALWAYS show the SQL via execute_query before presenting results
3. ALWAYS call generate_chart when data has more than 5 rows
4. NEVER expose patient names in aggregated reports
5. When generating flowcharts, call get_schema first for ER diagrams
6. Be concise but medically accurate in explanations
7. For follow-up prompts (e.g., "convert this to pie chart", "now make it line chart"),
   reuse the most recent relevant query/result context unless user explicitly changes topic
"""

# 3. Initialize the configured model provider (Gemini or Ollama)
llm = _build_llm()

# 4. Create the ReAct agent using langgraph
agent = create_react_agent(llm, tools, prompt=system_instructions)
fallback_agent = None


def _extract_sql(text: str) -> str | None:
    if not text:
        return None

    code_block_match = re.search(r"```sql\s*(.*?)\s*```", text, flags=re.IGNORECASE | re.DOTALL)
    if code_block_match:
        sql_candidate = code_block_match.group(1).strip()
        if sql_candidate.upper().startswith("SELECT"):
            return sql_candidate.rstrip(";") + ";"

    select_match = re.search(r"(SELECT\s.+?)(?:;|$)", text, flags=re.IGNORECASE | re.DOTALL)
    if select_match:
        sql_candidate = re.sub(r"\s+", " ", select_match.group(1)).strip()
        if sql_candidate.upper().startswith("SELECT"):
            return sql_candidate.rstrip(";") + ";"

    return None


def _normalize_ai_content(content) -> str:
    """Normalizes model message content to plain text.

    Gemini/LangChain may return content as a string, list of text blocks,
    or mixed structures. This helper safely flattens all supported forms.
    """
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
                else:
                    parts.append(str(item))
            else:
                text_attr = getattr(item, "text", None)
                if isinstance(text_attr, str):
                    parts.append(text_attr)
                else:
                    parts.append(str(item))
        return "\n".join([p for p in parts if p]).strip()

    return str(content)


def _strip_plotly_json_from_text(text: str) -> str:
    """Removes large inline Plotly JSON blobs from assistant prose."""
    if not isinstance(text, str) or not text:
        return text

    cleaned = re.sub(
        r"```json\s*\{[\s\S]*?\"data\"[\s\S]*?\"layout\"[\s\S]*?\}\s*```",
        "",
        text,
        flags=re.IGNORECASE,
    )

    start = cleaned.find('{"data"')
    while start != -1:
        depth = 0
        end = -1
        for i in range(start, len(cleaned)):
            ch = cleaned[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end = i
                    break

        if end == -1:
            break

        candidate = cleaned[start:end + 1]
        if '"data"' in candidate and '"layout"' in candidate and len(candidate) > 200:
            cleaned = (cleaned[:start] + cleaned[end + 1:]).strip()
            start = cleaned.find('{"data"')
        else:
            start = cleaned.find('{"data"', end + 1)

    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()
    return cleaned


def _is_quota_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "429" in msg or "quota" in msg or "rate limit" in msg


def _invoke_agent_with_fallback(past_msgs_formatted):
    global fallback_agent

    try:
        return agent.invoke({"messages": past_msgs_formatted})
    except Exception as first_exc:
        provider = os.getenv("LLM_PROVIDER", "auto").lower()

        if not _is_quota_error(first_exc) or provider not in ("auto", "gemini"):
            raise

        # 1) Try alternate Gemini model when quota/model availability issues happen.
        alt_model = (os.getenv("GEMINI_FALLBACK_MODEL") or "").strip()
        current_model = os.getenv("GEMINI_MODEL", "")
        if alt_model and alt_model != current_model and os.getenv("GEMINI_API_KEY"):
            try:
                alt_llm = _build_gemini_llm(alt_model)
                alt_agent = create_react_agent(alt_llm, tools, prompt=system_instructions)
                return alt_agent.invoke({"messages": past_msgs_formatted})
            except Exception:
                pass

        # 2) Fall back to Ollama so demo can continue instead of failing hard.
        try:
            if fallback_agent is None:
                fallback_agent = create_react_agent(_build_ollama_llm(), tools, prompt=system_instructions)
            return fallback_agent.invoke({"messages": past_msgs_formatted})
        except Exception:
            raise first_exc


def _invoke_llm_with_fallback(prompt_text: str):
    """Invokes base LLM and retries with fallback models on quota errors."""
    try:
        return llm.invoke(prompt_text)
    except Exception as first_exc:
        provider = os.getenv("LLM_PROVIDER", "auto").lower()
        if not _is_quota_error(first_exc) or provider not in ("auto", "gemini"):
            raise

        alt_model = (os.getenv("GEMINI_FALLBACK_MODEL") or "").strip()
        current_model = os.getenv("GEMINI_MODEL", "")
        if alt_model and alt_model != current_model and os.getenv("GEMINI_API_KEY"):
            try:
                alt_llm = _build_gemini_llm(alt_model)
                return alt_llm.invoke(prompt_text)
            except Exception:
                pass

        try:
            ollama_llm = _build_ollama_llm()
            return ollama_llm.invoke(prompt_text)
        except Exception:
            raise first_exc


def run_agent(user_message: str, session_id: str = "default") -> dict:
    """
    Main function to send a message to the agent and format the response.
    """
    import json
    from sqlalchemy import text
    from database.connection import db_manager
    
    try:
        # Fetch conversation history from the database to give the AI memory
        engine = db_manager.get_engine("operations")
        past_msgs_formatted = []
        
        with engine.connect() as conn:
            # Get recent messages (not oldest) and then restore chronological order.
            rows = conn.execute(
                text(
                    "SELECT role, content FROM chat_history "
                    "WHERE session_id = :sid ORDER BY created_at DESC LIMIT 20"
                ),
                {"sid": session_id},
            ).fetchall()

            for row in reversed(rows):
                role, msg = row[0], row[1]
                lc_role = "assistant" if role == "assistant" else "user"
                if msg:
                    past_msgs_formatted.append({"role": lc_role, "content": msg})

        # Append the current user message
        past_msgs_formatted.append({"role": "user", "content": user_message})

        # Run the agent with the injected memory
        result = _invoke_agent_with_fallback(past_msgs_formatted)

        # Extract the final response from the agent messages
        messages = result.get("messages", [])
        final_response = "I processed your request."
        
        sql_output = None
        chart_output = None
        flowchart_output = None
        row_count_output = None
        note_output = None
        chart_insight_output = None

        # Iterate backwards to get the most recent valid outputs
        for msg in reversed(messages):
            if hasattr(msg, "type"):
                if msg.type == "ai" and msg.content and final_response == "I processed your request.":
                    import re
                    normalized_content = _normalize_ai_content(msg.content)
                    # Strip out ```mermaid ... ``` blocks from the text response so they don't double-print
                    cleaned_content = re.sub(r"```(?:mermaid)?\n?.*?```", "", normalized_content, flags=re.DOTALL).strip()
                    cleaned_content = _strip_plotly_json_from_text(cleaned_content)
                    final_response = cleaned_content if cleaned_content else "Here is the diagram:"
                elif msg.type == "tool":
                    try:
                        # Langchain tools often return stringified JSON
                        data = json.loads(msg.content)
                        if msg.name == "execute_query" and not sql_output:
                            sql_output = data.get("sql")
                            row_count_output = data.get("row_count")
                            note_output = data.get("note")
                        elif msg.name == "generate_chart" and not chart_output:
                            chart_output = data.get("chart_json")
                            chart_insight_output = data.get("insight")
                        elif msg.name == "generate_flowchart" and not flowchart_output:
                            flowchart_output = data.get("mermaid_code")
                    except Exception:
                        pass

        # If chart JSON is already returned separately, prevent massive raw JSON from polluting assistant text.
        if chart_output and isinstance(final_response, str) and "chart_json" in final_response:
            before_json = final_response.split('{"chart_json"', 1)[0].strip()
            if "Explanation of Results:" in final_response:
                explanation = final_response.split("Explanation of Results:", 1)[1].strip()
                final_response = ((before_json + "\n\n") if before_json else "") + explanation
            else:
                final_response = before_json or "Here is the generated chart and summary."

        # Some model/tool traces don't include a clean final AI message.
        # Build a concise human-readable fallback from tool outputs instead of a generic placeholder.
        if isinstance(final_response, str) and final_response.strip() in {"I processed your request.", "Here is the diagram:", ""}:
            parts = []
            if isinstance(row_count_output, int):
                parts.append(f"I found {row_count_output} records for your request.")
            if isinstance(chart_insight_output, str) and chart_insight_output.strip():
                parts.append(chart_insight_output.strip())
            elif chart_output:
                parts.append("I generated an interactive chart from the query results.")
            if isinstance(note_output, str) and note_output.strip() and "Truncated" in note_output:
                parts.append(note_output.strip())

            final_response = "\n\n".join(parts) if parts else "Query executed successfully and results are ready."

        return {
            "response": final_response,
            "sql": sql_output,
            "chart": chart_output,
            "flowchart": flowchart_output,
            "type": "mixed"
        }
    except Exception as e:
        return {
            "response": f"I encountered an error while thinking: {str(e)}",
            "type": "text"
        }


def generate_sql_preview(user_message: str) -> dict:
    """Generates a SQL query preview without executing it."""
    from database.connection import db_manager

    schemas = db_manager.get_all_schemas()
    schema_text = str(schemas)

    preview_prompt = (
        "You are a medical SQL assistant. Generate exactly one safe SELECT query for the user request. "
        "Do not execute anything. Return only SQL in a ```sql code block. "
        "Use only tables and columns from this schema: "
        f"{schema_text}\n\n"
        f"User request: {user_message}"
    )

    try:
        response = _invoke_llm_with_fallback(preview_prompt)
        content = _normalize_ai_content(getattr(response, "content", response))
        sql_query = _extract_sql(content)

        if not sql_query:
            return {
                "response": "I could not generate a safe SQL query preview. Please rephrase your request.",
                "type": "text",
                "sql": None,
                "chart": None,
                "flowchart": None,
            }

        return {
            "response": "I generated the SQL preview below. Review it, then click Run Query to execute.",
            "type": "sql_preview",
            "sql": sql_query,
            "chart": None,
            "flowchart": None,
        }
    except Exception as e:
        return {
            "response": f"I could not generate SQL preview: {str(e)}",
            "type": "text",
            "sql": None,
            "chart": None,
            "flowchart": None,
        }


def run_sql_preview(sql_query: str, database: str = "clinical") -> dict:
    """Executes an approved SQL preview query and formats a response."""
    try:
        data = execute_query.invoke({"sql": sql_query, "database": database})
        if data.get("error"):
            return {
                "response": f"Query execution failed: {data['error']}",
                "type": "text",
                "sql": data.get("sql", sql_query),
                "chart": None,
                "flowchart": None,
            }

        row_count = data.get("row_count", 0)
        exec_ms = data.get("execution_time_ms", 0)
        note = data.get("note", "")
        response_text = f"Query executed successfully. Returned {row_count} rows in {exec_ms} ms."
        if note:
            response_text += f"\n\n{note}"

        return {
            "response": response_text,
            "type": "mixed",
            "sql": data.get("sql", sql_query),
            "chart": None,
            "flowchart": None,
        }
    except Exception as e:
        return {
            "response": f"I could not run the SQL query: {str(e)}",
            "type": "text",
            "sql": sql_query,
            "chart": None,
            "flowchart": None,
        }