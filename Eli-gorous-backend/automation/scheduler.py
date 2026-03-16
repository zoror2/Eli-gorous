"""
APScheduler background jobs.
"""
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()


def check_alerts_job():
    """Periodic job that checks all active alerts."""
    try:
        from automation.alerts import alert_manager
        alert_manager.check_alerts()
    except Exception as e:
        print(f"Scheduler alert check error: {e}")


def refresh_dashboard_job():
    """Periodic job placeholder for dashboard refresh."""
    print("[Scheduler] Dashboard refresh triggered.")


def start_scheduler():
    """Start the background scheduler with configured jobs."""
    scheduler.add_job(check_alerts_job, "interval", minutes=15, id="check_alerts", replace_existing=True)
    scheduler.add_job(refresh_dashboard_job, "interval", minutes=60, id="refresh_dashboard", replace_existing=True)
    scheduler.start()
    print("APScheduler started — alerts checked every 15 min, dashboard refreshed every 60 min.")


def stop_scheduler():
    """Stop the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("APScheduler stopped.")
