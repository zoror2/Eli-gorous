"""
Operations database setup.
Creates tables for chat history, dashboard pins, alerts, and notifications.
"""
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime,
    create_engine, MetaData, Table, text
)
from database.connection import db_manager
import datetime


def setup_operations_db():
    """Create operations tables for app state management."""
    engine = db_manager.get_engine("operations")
    if engine is None:
        print("Operations engine not available, skipping setup.")
        return

    metadata = MetaData()

    # Chat history table
    Table(
        "chat_history", metadata,
        Column("id", Integer, primary_key=True, autoincrement=True),
        Column("session_id", String, index=True),
        Column("role", String),  # "user" or "assistant"
        Column("message", Text),
        Column("sql_query", Text, nullable=True),
        Column("chart_data", Text, nullable=True),
        Column("flowchart_data", Text, nullable=True),
        Column("response_type", String, default="text"),
        Column("is_favorite", Boolean, default=False),
        Column("created_at", String, default=str(datetime.datetime.now())),
    )

    # Dashboard pinned charts
    Table(
        "dashboard_pins", metadata,
        Column("id", Integer, primary_key=True, autoincrement=True),
        Column("session_id", String),
        Column("title", String),
        Column("chart_data", Text),  # JSON string
        Column("created_at", String, default=str(datetime.datetime.now())),
    )

    # Alerts table
    Table(
        "alerts", metadata,
        Column("id", Integer, primary_key=True, autoincrement=True),
        Column("condition_sql", Text),
        Column("threshold", Float),
        Column("operator", String),  # >, <, =, >=, <=
        Column("message", Text),
        Column("active", Boolean, default=True),
        Column("last_triggered", String, nullable=True),
        Column("created_at", String, default=str(datetime.datetime.now())),
    )

    # Alert history
    Table(
        "alert_history", metadata,
        Column("id", Integer, primary_key=True, autoincrement=True),
        Column("alert_id", Integer),
        Column("triggered_value", Float),
        Column("message", Text),
        Column("notified", Boolean, default=False),
        Column("created_at", String, default=str(datetime.datetime.now())),
    )

    # Notification log
    Table(
        "notification_log", metadata,
        Column("id", Integer, primary_key=True, autoincrement=True),
        Column("alert_id", Integer, nullable=True),
        Column("channel", String),  # "console", "sms", "email"
        Column("recipient", String, nullable=True),
        Column("message", Text),
        Column("status", String, default="sent"),
        Column("created_at", String, default=str(datetime.datetime.now())),
    )

    metadata.create_all(engine)
    print("Operations database tables created.")
