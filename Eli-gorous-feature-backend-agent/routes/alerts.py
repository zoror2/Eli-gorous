"""
Alerts CRUD endpoints.
"""
from fastapi import APIRouter
from models.schemas import AlertCreate
from automation.alerts import alert_manager
from sqlalchemy import text
from database.connection import db_manager
import datetime

router = APIRouter(prefix="/alerts", tags=["Alerts"])


def _build_system_alerts() -> list[dict]:
    """Builds lightweight insight alerts from clinical data for empty-state usefulness."""
    clinical_engine = db_manager.get_engine("clinical")
    if clinical_engine is None:
        return []

    now = str(datetime.datetime.now())
    items: list[dict] = []

    with clinical_engine.connect() as conn:
        emergency_count = conn.execute(
            text("SELECT COUNT(*) FROM encounters WHERE lower(encounter_type) = 'emergency'")
        ).scalar() or 0

        avg_systolic = conn.execute(
            text("SELECT AVG(value) FROM observations WHERE observation_type = 'Blood Pressure Systolic'")
        ).scalar()

        active_conditions = conn.execute(
            text("SELECT COUNT(*) FROM conditions WHERE resolved_date IS NULL")
        ).scalar() or 0

    emergency_count = int(emergency_count)
    active_conditions = int(active_conditions)
    avg_systolic_val = float(avg_systolic) if avg_systolic is not None else 0.0

    emergency_severity = "warning" if emergency_count >= 2 else "info"
    bp_severity = "critical" if avg_systolic_val >= 160 else "warning" if avg_systolic_val >= 140 else "info"
    chronic_severity = "warning" if active_conditions >= 6 else "info"

    items.append(
        {
            "id": "sys-emergency-load",
            "title": "Emergency Encounter Load",
            "message": f"{emergency_count} emergency encounters recorded in the current dataset.",
            "severity": emergency_severity,
            "timestamp": now,
            "source": "Clinical Analytics",
        }
    )
    items.append(
        {
            "id": "sys-bp-trend",
            "title": "Average Systolic BP Trend",
            "message": f"Average systolic blood pressure is {avg_systolic_val:.1f} mmHg.",
            "severity": bp_severity,
            "timestamp": now,
            "source": "Clinical Analytics",
        }
    )
    items.append(
        {
            "id": "sys-active-conditions",
            "title": "Unresolved Condition Load",
            "message": f"{active_conditions} conditions are currently unresolved in patient records.",
            "severity": chronic_severity,
            "timestamp": now,
            "source": "Clinical Analytics",
        }
    )

    return items


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
    """Returns display-ready alerts for frontend feed."""
    alert_cards: list[dict] = []

    # Include recent triggered alerts first.
    for item in alert_manager.get_recent_trigger_history(limit=20):
        alert_cards.append(
            {
                "id": f"trigger-{item['id']}",
                "title": "Triggered Alert",
                "message": item.get("message") or "An alert condition was triggered.",
                "severity": "critical",
                "timestamp": item.get("created_at") or str(datetime.datetime.now()),
                "source": "Alert Engine",
            }
        )

    # Include active alert rules so users can see configured monitors.
    for rule in alert_manager.get_all_alerts():
        is_recently_triggered = bool(rule.get("last_triggered"))
        alert_cards.append(
            {
                "id": f"rule-{rule['id']}",
                "title": "Active Alert Rule",
                "message": rule.get("message") or "Custom alert rule is active.",
                "severity": "warning" if is_recently_triggered else "info",
                "timestamp": rule.get("last_triggered") or rule.get("created_at") or str(datetime.datetime.now()),
                "source": "Rules Monitor",
            }
        )

    # Ensure Alerts page always provides useful content even before custom rules exist.
    if not alert_cards:
        alert_cards.extend(_build_system_alerts())

    return alert_cards


@router.delete("/{alert_id}")
async def deactivate_alert(alert_id: int):
    """Deactivates an alert."""
    alert_manager.deactivate_alert(alert_id)
    return {"status": "deactivated", "alert_id": alert_id}
