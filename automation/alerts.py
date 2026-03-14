"""
Alert checking logic.
"""
import datetime
from sqlalchemy import text
from database.connection import db_manager


class AlertManager:
    def __init__(self):
        self.engine = db_manager.get_engine("operations")

    def create_alert(self, condition_sql: str, threshold: float, operator: str, message: str) -> int:
        """Saves alert to DB and returns the alert id."""
        with self.engine.connect() as conn:
            result = conn.execute(
                text(
                    "INSERT INTO alerts (condition_sql, threshold, operator, message, active, created_at) "
                    "VALUES (:sql, :threshold, :op, :msg, 1, :now)"
                ),
                {
                    "sql": condition_sql,
                    "threshold": threshold,
                    "op": operator,
                    "msg": message,
                    "now": str(datetime.datetime.now()),
                },
            )
            conn.commit()
            return result.lastrowid

    def get_all_alerts(self) -> list:
        """Returns all active alerts."""
        with self.engine.connect() as conn:
            rows = conn.execute(
                text("SELECT id, condition_sql, threshold, operator, message, active, last_triggered, created_at FROM alerts WHERE active = 1")
            ).fetchall()
            return [
                {
                    "id": r[0], "condition_sql": r[1], "threshold": r[2],
                    "operator": r[3], "message": r[4], "active": bool(r[5]),
                    "last_triggered": r[6], "created_at": r[7],
                }
                for r in rows
            ]

    def deactivate_alert(self, alert_id: int):
        """Deactivates an alert."""
        with self.engine.connect() as conn:
            conn.execute(text("UPDATE alerts SET active = 0 WHERE id = :id"), {"id": alert_id})
            conn.commit()

    def check_alerts(self):
        """Loops through all active alerts, evaluates them, fires notifications if triggered."""
        from automation.notifier import send_alert

        alerts = self.get_all_alerts()
        for alert in alerts:
            try:
                # Execute the condition SQL against the clinical DB
                result = db_manager.execute(alert["condition_sql"], "clinical")
                if not result:
                    continue

                # Get the first numeric value from the result
                first_row = result[0]
                val = list(first_row.values())[0]
                val = float(val)

                triggered = False
                op = alert["operator"]
                threshold = alert["threshold"]

                if op == ">" and val > threshold:
                    triggered = True
                elif op == "<" and val < threshold:
                    triggered = True
                elif op == "=" and val == threshold:
                    triggered = True
                elif op == ">=" and val >= threshold:
                    triggered = True
                elif op == "<=" and val <= threshold:
                    triggered = True

                if triggered:
                    msg = f"[ALERT] {alert['message']} (Current value: {val}, Threshold: {op} {threshold})"
                    send_alert(msg)

                    # Log to alert_history
                    now = str(datetime.datetime.now())
                    with self.engine.connect() as conn:
                        conn.execute(
                            text(
                                "INSERT INTO alert_history (alert_id, triggered_value, message, notified, created_at) "
                                "VALUES (:aid, :val, :msg, 1, :now)"
                            ),
                            {"aid": alert["id"], "val": val, "msg": msg, "now": now},
                        )
                        conn.execute(
                            text("UPDATE alerts SET last_triggered = :now WHERE id = :id"),
                            {"now": now, "id": alert["id"]},
                        )
                        conn.commit()

            except Exception as e:
                print(f"Error checking alert {alert['id']}: {e}")


alert_manager = AlertManager()
