"""
Chat history endpoints.
"""
import json
import datetime
from fastapi import APIRouter
from sqlalchemy import text
from database.connection import db_manager

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/{session_id}")
async def get_history(session_id: str):
    """Returns list of past messages for a session."""
    engine = db_manager.get_engine("operations")
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                "SELECT id, session_id, role, message, sql_query, chart_data, "
                "flowchart_data, response_type, is_favorite, created_at "
                "FROM chat_history WHERE session_id = :sid ORDER BY created_at ASC"
            ),
            {"sid": session_id},
        ).fetchall()

    return [
        {
            "id": r[0], "session_id": r[1], "role": r[2], "message": r[3],
            "sql_query": r[4], "chart_data": json.loads(r[5]) if r[5] else None,
            "flowchart_data": r[6], "response_type": r[7],
            "is_favorite": bool(r[8]), "created_at": r[9],
        }
        for r in rows
    ]


@router.delete("/{session_id}")
async def clear_history(session_id: str):
    """Clears history for a session."""
    engine = db_manager.get_engine("operations")
    with engine.connect() as conn:
        conn.execute(
            text("DELETE FROM chat_history WHERE session_id = :sid"),
            {"sid": session_id},
        )
        conn.commit()
    return {"status": "cleared", "session_id": session_id}


@router.post("/{session_id}/favorite")
async def toggle_favorite(session_id: str, message_id: int):
    """Marks a query as favorite."""
    engine = db_manager.get_engine("operations")
    with engine.connect() as conn:
        # Toggle the is_favorite flag
        conn.execute(
            text(
                "UPDATE chat_history SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END "
                "WHERE id = :mid AND session_id = :sid"
            ),
            {"mid": message_id, "sid": session_id},
        )
        conn.commit()
    return {"status": "toggled", "message_id": message_id}
