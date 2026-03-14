"""
Notification sender — console, SMS (Twilio), and email (SMTP).
"""
import os
import datetime
from sqlalchemy import text
from database.connection import db_manager


def _log_notification(alert_id, channel: str, recipient: str, message: str, status: str = "sent"):
    """Log every notification to the operations DB."""
    try:
        engine = db_manager.get_engine("operations")
        with engine.connect() as conn:
            conn.execute(
                text(
                    "INSERT INTO notification_log (alert_id, channel, recipient, message, status, created_at) "
                    "VALUES (:aid, :ch, :rec, :msg, :st, :now)"
                ),
                {
                    "aid": alert_id,
                    "ch": channel,
                    "rec": recipient or "",
                    "msg": message,
                    "st": status,
                    "now": str(datetime.datetime.now()),
                },
            )
            conn.commit()
    except Exception as e:
        print(f"Failed to log notification: {e}")


def send_alert(message: str, alert_id=None):
    """Prints alert to console (always) and logs it."""
    print(f"\n{'='*60}")
    print(f"🚨 ALERT: {message}")
    print(f"{'='*60}\n")
    _log_notification(alert_id, "console", "stdout", message)


def send_sms(to: str, message: str, alert_id=None):
    """Send SMS via Twilio if configured."""
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "optional")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "optional")
    from_number = os.getenv("TWILIO_FROM_NUMBER", "optional")

    if account_sid == "optional" or auth_token == "optional":
        print(f"[SMS] Twilio not configured. Would have sent to {to}: {message}")
        _log_notification(alert_id, "sms", to, message, "skipped_not_configured")
        return

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        client.messages.create(body=message, from_=from_number, to=to)
        _log_notification(alert_id, "sms", to, message)
        print(f"[SMS] Sent to {to}")
    except Exception as e:
        print(f"[SMS] Failed: {e}")
        _log_notification(alert_id, "sms", to, message, f"failed: {e}")


def send_email(to: str, subject: str, body: str, alert_id=None):
    """Send email via SMTP if configured."""
    smtp_email = os.getenv("SMTP_EMAIL", "optional")
    smtp_password = os.getenv("SMTP_PASSWORD", "optional")

    if smtp_email == "optional" or smtp_password == "optional":
        print(f"[EMAIL] SMTP not configured. Would have sent to {to}: {subject}")
        _log_notification(alert_id, "email", to, body, "skipped_not_configured")
        return

    try:
        import smtplib
        from email.mime.text import MIMEText

        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = smtp_email
        msg["To"] = to

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, to, msg.as_string())

        _log_notification(alert_id, "email", to, body)
        print(f"[EMAIL] Sent to {to}")
    except Exception as e:
        print(f"[EMAIL] Failed: {e}")
        _log_notification(alert_id, "email", to, body, f"failed: {e}")
