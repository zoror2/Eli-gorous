"""
Dashboard endpoints — pin/unpin charts.
"""
import json
import datetime
import secrets
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from database.connection import db_manager
from models.schemas import PinChartRequest

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _ensure_dashboard_shares_table(conn):
    """Creates dashboard_shares table if missing for backward compatibility."""
    conn.execute(
        text(
            "CREATE TABLE IF NOT EXISTS dashboard_shares ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, "
            "chart_id INTEGER NOT NULL, "
            "share_token TEXT NOT NULL UNIQUE, "
            "created_at TEXT NOT NULL"
            ")"
        )
    )
    conn.commit()


def _get_table_columns(conn, table_name: str) -> set[str]:
    try:
        rows = conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
        return {str(r[1]) for r in rows}
    except Exception:
        return set()


@router.get("/overview")
async def get_dashboard_overview():
    """Returns live dashboard metrics for command center cards and charts."""
    clinical_engine = db_manager.get_engine("clinical")
    operations_engine = db_manager.get_engine("operations")

    # Safe defaults when data is sparse.
    result = {
        "activeERPatients": 0,
        "criticalAlerts": 0,
        "openCases": 0,
        "dischargeRate": 0,
        "admissionsFlow": [{"hour": f"{h:02d}:00", "admissions": 0, "discharges": 0} for h in range(24)],
        "recentCritical": [],
    }

    if clinical_engine is None:
        return result

    with clinical_engine.connect() as conn:
        encounter_cols = _get_table_columns(conn, "encounters")
        condition_cols = _get_table_columns(conn, "conditions")
        patient_cols = _get_table_columns(conn, "patients")
        observation_cols = _get_table_columns(conn, "observations")

        # ER load proxy: unique patients seen in emergency department.
        if {"patient_id", "department"}.issubset(encounter_cols):
            try:
                active_er = conn.execute(
                    text("SELECT COUNT(DISTINCT patient_id) FROM encounters WHERE department = 'Emergency'")
                ).scalar() or 0
                result["activeERPatients"] = int(active_er)
            except Exception:
                pass

        # Open cases from conditions table.
        if "status" in condition_cols:
            try:
                open_cases = conn.execute(
                    text(
                        "SELECT COUNT(*) FROM conditions "
                        "WHERE lower(status) IN ('active', 'open', 'ongoing', 'critical', 'severe')"
                    )
                ).scalar() or 0
                result["openCases"] = int(open_cases)
            except Exception:
                pass
        elif "resolved_date" in condition_cols:
            try:
                open_cases = conn.execute(
                    text("SELECT COUNT(*) FROM conditions WHERE resolved_date IS NULL")
                ).scalar() or 0
                result["openCases"] = int(open_cases)
            except Exception:
                pass

        # Admissions/discharges by hour from encounter timestamps where possible.
        by_hour = {f"{h:02d}:00": {"hour": f"{h:02d}:00", "admissions": 0, "discharges": 0} for h in range(24)}

        if "admission_date" in encounter_cols:
            try:
                admissions_rows = conn.execute(
                    text(
                        "SELECT printf('%02d:00', CAST(strftime('%H', admission_date) AS INTEGER)) AS hour, COUNT(*) AS admissions "
                        "FROM encounters WHERE admission_date IS NOT NULL GROUP BY hour"
                    )
                ).fetchall()
            except Exception:
                admissions_rows = []
        else:
            admissions_rows = []

        if "discharge_date" in encounter_cols:
            try:
                discharges_rows = conn.execute(
                    text(
                        "SELECT printf('%02d:00', CAST(strftime('%H', discharge_date) AS INTEGER)) AS hour, COUNT(*) AS discharges "
                        "FROM encounters WHERE discharge_date IS NOT NULL GROUP BY hour"
                    )
                ).fetchall()
            except Exception:
                discharges_rows = []
        elif {"status", "diagnosed_date"}.issubset(condition_cols):
            try:
                discharges_rows = conn.execute(
                    text(
                        "SELECT printf('%02d:00', CAST(strftime('%H', diagnosed_date) AS INTEGER)) AS hour, COUNT(*) AS discharges "
                        "FROM conditions WHERE lower(status) IN ('resolved', 'recovered', 'closed') AND diagnosed_date IS NOT NULL GROUP BY hour"
                    )
                ).fetchall()
            except Exception:
                discharges_rows = []
        else:
            discharges_rows = []

        for row in admissions_rows:
            if row[0] in by_hour:
                by_hour[row[0]]["admissions"] = int(row[1])
        for row in discharges_rows:
            if row[0] in by_hour:
                by_hour[row[0]]["discharges"] = int(row[1])
        result["admissionsFlow"] = [by_hour[f"{h:02d}:00"] for h in range(24)]

        total_adm = sum(v["admissions"] for v in result["admissionsFlow"])
        total_dis = sum(v["discharges"] for v in result["admissionsFlow"])
        result["dischargeRate"] = int(round((total_dis / total_adm) * 100)) if total_adm > 0 else 0

        # Recent critical list with schema-aware date/patient naming.
        patient_name_expr = "p.name" if "name" in patient_cols else "(p.first_name || ' ' || p.last_name)"
        diagnosed_col = "c.diagnosed_date" if "diagnosed_date" in condition_cols else "NULL"
        severity_expr = "lower(c.severity)" if "severity" in condition_cols else "''"

        try:
            critical_rows = conn.execute(
                text(
                    f"SELECT p.id, {patient_name_expr} AS patient_name, c.condition_name, {diagnosed_col} AS event_time, {severity_expr} AS sev "
                    "FROM conditions c "
                    "JOIN patients p ON p.id = c.patient_id "
                    "ORDER BY event_time DESC LIMIT 8"
                )
            ).fetchall()
        except Exception:
            critical_rows = []

        critical_keywords = ["acute", "infarction", "pneumonia", "fracture", "appendicitis", "critical", "severe"]
        recent = []
        for row in critical_rows:
            condition_name = str(row[2] or "Unknown Condition")
            lower_name = condition_name.lower()
            sev_text = str(row[4] or "")
            severity = "critical" if any(k in lower_name for k in critical_keywords) or sev_text in ("critical", "severe") else "warning"
            patient_label = str(row[1] or row[0])
            recent.append(
                {
                    "id": str(row[0]),
                    "patient": patient_label,
                    "condition": condition_name,
                    "severity": severity,
                    "time": str(row[3] or "recent"),
                }
            )
        result["recentCritical"] = recent[:5]

    if operations_engine is not None:
        with operations_engine.connect() as conn:
            try:
                critical_alerts = conn.execute(
                    text("SELECT COUNT(*) FROM alerts WHERE active = 1")
                ).scalar() or 0
                result["criticalAlerts"] = int(critical_alerts)
            except Exception:
                pass

            # Keep overview purely clinical/operational KPIs (no synthetic latency here).

    return result


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


@router.post("/{chart_id}/share")
async def create_share_link(chart_id: int):
    """Creates (or returns) a share token for a pinned chart."""
    engine = db_manager.get_engine("operations")
    with engine.connect() as conn:
        _ensure_dashboard_shares_table(conn)

        chart_exists = conn.execute(
            text("SELECT id FROM dashboard_pins WHERE id = :id LIMIT 1"),
            {"id": chart_id},
        ).scalar()
        if chart_exists is None:
            raise HTTPException(status_code=404, detail="Pinned chart not found")

        existing = conn.execute(
            text("SELECT share_token FROM dashboard_shares WHERE chart_id = :id ORDER BY id DESC LIMIT 1"),
            {"id": chart_id},
        ).scalar()
        if existing:
            return {"status": "shared", "chart_id": chart_id, "share_token": str(existing)}

        token = ""
        for _ in range(5):
            candidate = secrets.token_urlsafe(12)
            token_exists = conn.execute(
                text("SELECT 1 FROM dashboard_shares WHERE share_token = :token LIMIT 1"),
                {"token": candidate},
            ).scalar()
            if not token_exists:
                token = candidate
                break

        if not token:
            raise HTTPException(status_code=500, detail="Failed to create unique share token")

        conn.execute(
            text(
                "INSERT INTO dashboard_shares (chart_id, share_token, created_at) "
                "VALUES (:chart_id, :share_token, :created_at)"
            ),
            {
                "chart_id": chart_id,
                "share_token": token,
                "created_at": str(datetime.datetime.now()),
            },
        )
        conn.commit()

    return {"status": "shared", "chart_id": chart_id, "share_token": token}


@router.get("/share/{share_token}")
async def get_shared_chart(share_token: str):
    """Returns pinned chart data by share token for external viewing."""
    engine = db_manager.get_engine("operations")
    with engine.connect() as conn:
        _ensure_dashboard_shares_table(conn)

        row = conn.execute(
            text(
                "SELECT p.id, p.title, p.chart_data, p.created_at, s.created_at "
                "FROM dashboard_shares s "
                "JOIN dashboard_pins p ON p.id = s.chart_id "
                "WHERE s.share_token = :token "
                "LIMIT 1"
            ),
            {"token": share_token},
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Shared chart not found")

    return {
        "chart_id": row[0],
        "title": row[1],
        "chart_data": json.loads(row[2]) if row[2] else None,
        "pinned_at": row[3],
        "shared_at": row[4],
        "share_token": share_token,
    }
