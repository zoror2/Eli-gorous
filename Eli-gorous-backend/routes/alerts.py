"""
Alerts CRUD endpoints.
"""
from fastapi import APIRouter
from models.schemas import AlertCreate
from automation.alerts import alert_manager

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.post("")
async def create_alert(request: AlertCreate):
    """Creates a new alert."""
    alert_id = alert_manager.create_alert(
        condition_sql=request.condition_sql,
        threshold=request.threshold,
        operator=request.operator,
        message=request.message,
    )
    return {"status": "created", "alert_id": alert_id}


@router.get("")
async def get_alerts():
    """Returns all active alerts."""
    return alert_manager.get_all_alerts()


@router.delete("/{alert_id}")
async def deactivate_alert(alert_id: int):
    """Deactivates an alert."""
    alert_manager.deactivate_alert(alert_id)
    return {"status": "deactivated", "alert_id": alert_id}
