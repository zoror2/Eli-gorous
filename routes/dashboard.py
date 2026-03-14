"""
Dashboard endpoints — pin/unpin charts.
"""
import json
import datetime
from fastapi import APIRouter
from sqlalchemy import text
from database.connection import db_manager
from models.schemas import PinChartRequest

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.post("/pin")
async def pin_chart(request: PinChartRequest):
    """Saves chart to dashboard table in operations DB."""
    engine = db_manager.get_engine("operations")
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "INSERT INTO dashboard_pins (session_id, title, chart_data, created_at) "
                "VALUES (:sid, :title, :data, :now)"
            ),
            {
                "sid": request.session_id,
                "title": request.title,
                "data": json.dumps(request.chart_data),
                "now": str(datetime.datetime.now()),
            },
        )
        conn.commit()
        return {"status": "pinned", "chart_id": result.lastrowid}


@router.get("")
async def get_dashboard():
    """Returns all pinned charts."""
    engine = db_manager.get_engine("operations")
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT id, session_id, title, chart_data, created_at FROM dashboard_pins ORDER BY created_at DESC")
        ).fetchall()

    return [
        {
            "id": r[0], "session_id": r[1], "title": r[2],
            "chart_data": json.loads(r[3]) if r[3] else None,
            "created_at": r[4],
        }
        for r in rows
    ]


@router.delete("/{chart_id}")
async def unpin_chart(chart_id: int):
    """Unpins a chart."""
    engine = db_manager.get_engine("operations")
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM dashboard_pins WHERE id = :id"), {"id": chart_id})
        conn.commit()
    return {"status": "unpinned", "chart_id": chart_id}
