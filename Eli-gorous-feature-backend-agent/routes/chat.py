"""
Chat endpoint — the main AI interaction route.
"""
import json
import datetime
import re
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from models.schemas import ChatRequest, ChatResponse
from agent.agent_core import run_agent, generate_sql_preview, run_sql_preview
from agent.tools.execute_query import execute_query
from agent.tools.generate_chart import generate_chart
from agent.tools.get_schema import get_schema
from database.connection import db_manager

router = APIRouter(tags=["Chat"])


def _detect_chart_type(message: str) -> str | None:
    msg = (message or "").lower()
    if "line" in msg:
        return "line"
    if "pie" in msg or "donut" in msg:
        return "pie"
    if "scatter" in msg:
        return "scatter"
    if "bar" in msg or "graph" in msg or "chart" in msg:
        return "bar"
    return None


def _get_latest_sql_for_session(session_id: str) -> str | None:
    engine = db_manager.get_engine("operations")
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                "SELECT data_json FROM chat_history "
                "WHERE session_id = :sid AND data_json IS NOT NULL "
                "ORDER BY created_at DESC LIMIT 30"
            ),
            {"sid": session_id},
        ).fetchall()

    for row in rows:
        raw = row[0]
        if not raw:
            continue
        try:
            payload = json.loads(raw) if isinstance(raw, str) else raw
        except Exception:
            continue
        sql = payload.get("sql") if isinstance(payload, dict) else None
        if isinstance(sql, str) and sql.strip().upper().startswith("SELECT"):
            return sql.strip()

    return None


def _infer_chart_axes(columns: list[str], rows: list[list]) -> tuple[str | None, str | None]:
    if not columns or not rows:
        return None, None

    sample = rows[0]
    x_col = None
    y_col = None

    for idx, col in enumerate(columns):
        if idx < len(sample) and isinstance(sample[idx], str) and x_col is None:
            x_col = col
        if idx < len(sample) and isinstance(sample[idx], (int, float)) and y_col is None:
            y_col = col

    if x_col is None:
        x_col = columns[0]
    if y_col is None:
        for col in columns[1:]:
            if re.search(r"count|total|num|amount|value", col, flags=re.IGNORECASE):
                y_col = col
                break
    if y_col is None and len(columns) > 1:
        y_col = columns[1]

    return x_col, y_col


def _build_chart_from_last_sql(session_id: str, user_message: str) -> dict | None:
    chart_type = _detect_chart_type(user_message)
    if not chart_type:
        return None

    last_sql = _get_latest_sql_for_session(session_id)
    if not last_sql:
        return None

    query_data = execute_query.invoke({"sql": last_sql, "database": "clinical"})
    if query_data.get("error"):
        return None

    columns = query_data.get("columns") or []
    rows = query_data.get("rows") or []
    x_col, y_col = _infer_chart_axes(columns, rows)
    if not x_col or not y_col:
        return None

    chart_title = f"{chart_type.capitalize()} Chart from Latest Query"
    chart_data = generate_chart.invoke(
        {
            "sql": query_data.get("sql") or last_sql,
            "chart_type": chart_type,
            "x_column": x_col,
            "y_column": y_col,
            "title": chart_title,
        }
    )
    if chart_data.get("error") or not chart_data.get("chart_json"):
        return None

    insight = chart_data.get("insight")
    response_text = f"Generated a {chart_type} chart from your previous query results."
    if isinstance(insight, str) and insight.strip():
        response_text += f"\n\n{insight.strip()}"

    return {
        "response": response_text,
        "sql": query_data.get("sql") or last_sql,
        "chart": chart_data.get("chart_json"),
        "flowchart": None,
        "type": "mixed",
    }


def _save_to_history(session_id: str, role: str, content: str,
                     sql_query=None, chart_data=None, flowchart_data=None,
                     response_type="text"):
    """Save a full interaction to chat history in the operations DB."""
    import uuid
    try:
        engine = db_manager.get_engine("operations")
        with engine.connect() as conn:
            data_dict = {}
            if sql_query: data_dict["sql"] = sql_query
            if chart_data: data_dict["chart"] = chart_data
            if flowchart_data: data_dict["flowchart"] = flowchart_data
            data_json_str = json.dumps(data_dict) if data_dict else None
            
            conn.execute(
                text(
                    "INSERT INTO chat_history "
                    "(id, session_id, role, content, message_type, data_json, is_favorite, created_at) "
                    "VALUES (:id, :sid, :role, :content, :mtype, :djson, 0, :now)"
                ),
                {
                    "id": uuid.uuid4().hex,
                    "sid": session_id,
                    "role": role,
                    "content": content,
                    "mtype": response_type,
                    "djson": data_json_str,
                    "now": str(datetime.datetime.now()),
                },
            )
            conn.commit()
    except Exception as e:
        print(f"Failed to save chat history: {e}")



@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # Save user message to history
        _save_to_history(request.session_id, "user", request.message)

        if request.mode == "preview_sql":
            result = generate_sql_preview(request.message)
        elif request.mode == "run_sql":
            if not request.sql_override:
                raise HTTPException(status_code=400, detail="sql_override is required when mode=run_sql")
            result = run_sql_preview(request.sql_override, request.database or "clinical")
        else:
            # Deterministic follow-up chart conversion: reuse last SQL and render real chart payload.
            followup_chart = _build_chart_from_last_sql(request.session_id, request.message)
            if followup_chart:
                result = followup_chart
            else:
                # Hand the user's message to the AI brain
                result = run_agent(request.message, request.session_id)

        response_text = (result.get("response") or "").strip()
        if not response_text or response_text == "I processed your request.":
            if result.get("chart"):
                response_text = "I ran the query and generated an interactive visualization from the results."
            elif result.get("sql"):
                response_text = "I ran the query successfully. The SQL used is attached below."
            elif result.get("flowchart"):
                response_text = "I generated the requested flowchart."
            else:
                response_text = "I completed your request successfully."

        # Save assistant response to history
        _save_to_history(
            request.session_id, "assistant",
            response_text,
            sql_query=result.get("sql"),
            chart_data=result.get("chart"),
            flowchart_data=result.get("flowchart"),
            response_type=result.get("type", "text"),
        )

        return ChatResponse(
            response=response_text,
            sql=result.get("sql"),
            chart=result.get("chart"),
            flowchart=result.get("flowchart"),
            type=result.get("type", "text"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schema")
async def get_schema_endpoint():
    """Returns the raw database structure."""
    return get_schema.invoke({"database": "all"})