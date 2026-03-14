"""
Chat endpoint — the main AI interaction route.
"""
import json
import datetime
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from models.schemas import ChatRequest, ChatResponse
from agent.agent_core import run_agent
from agent.tools.get_schema import get_schema
from database.connection import db_manager

router = APIRouter(tags=["Chat"])


def _save_to_history(session_id: str, role: str, message: str,
                     sql_query=None, chart_data=None, flowchart_data=None,
                     response_type="text"):
    """Save a message to chat history in the operations DB."""
    try:
        engine = db_manager.get_engine("operations")
        with engine.connect() as conn:
            conn.execute(
                text(
                    "INSERT INTO chat_history "
                    "(session_id, role, message, sql_query, chart_data, flowchart_data, response_type, is_favorite, created_at) "
                    "VALUES (:sid, :role, :msg, :sql, :chart, :flow, :rtype, 0, :now)"
                ),
                {
                    "sid": session_id,
                    "role": role,
                    "msg": message,
                    "sql": sql_query,
                    "chart": json.dumps(chart_data) if chart_data else None,
                    "flow": flowchart_data,
                    "rtype": response_type,
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

        # Hand the user's message to the AI brain
        result = run_agent(request.message, request.session_id)

        # Save assistant response to history
        _save_to_history(
            request.session_id, "assistant",
            result.get("response", ""),
            sql_query=result.get("sql"),
            chart_data=result.get("chart"),
            flowchart_data=result.get("flowchart"),
            response_type=result.get("type", "text"),
        )

        return ChatResponse(
            response=result.get("response", "Error generating response."),
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