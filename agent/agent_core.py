import os
from dotenv import load_dotenv
from langchain_ollama import ChatOllama
from langgraph.prebuilt import create_react_agent
# Import the 5 tools
from agent.tools.get_schema import get_schema
from agent.tools.execute_query import execute_query
from agent.tools.generate_chart import generate_chart
from agent.tools.generate_flowchart import generate_flowchart
from agent.tools.explain_data import explain_data

load_dotenv()

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
"""

# 3. Initialize the local Ollama model
llm = ChatOllama(
    model=os.getenv("OLLAMA_MODEL", "llama3.1:8b"),
    base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
    temperature=0,      # Keep it at 0 so it writes deterministic, reliable SQL
    num_ctx=8192         # Large context window so it can read the whole schema
)

# 4. Create the ReAct agent using langgraph
agent = create_react_agent(llm, tools, prompt=system_instructions)


def run_agent(user_message: str, session_id: str = "default") -> dict:
    """
    Main function to send a message to the agent and format the response.
    """
    try:
        # Run the agent with the user message
        result = agent.invoke(
            {"messages": [{"role": "user", "content": user_message}]},
        )

        # Extract the final response from the agent messages
        messages = result.get("messages", [])
        final_response = "I processed your request."
        for msg in reversed(messages):
            # Get the last AI message content
            if hasattr(msg, "content") and msg.content and hasattr(msg, "type") and msg.type == "ai":
                final_response = msg.content
                break

        return {
            "response": final_response,
            "sql": None,
            "chart": None,
            "flowchart": None,
            "type": "mixed"
        }
    except Exception as e:
        return {
            "response": f"I encountered an error while thinking: {str(e)}",
            "type": "text"
        }