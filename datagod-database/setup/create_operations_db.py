"""
create_operations_db.py
Creates the SQLite operations database with all required tables.
"""

import os
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, create_engine
)
from sqlalchemy.orm import DeclarativeBase, relationship
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("OPERATIONS_DB_URL", "sqlite:///./operations.db")
engine = create_engine(DB_URL, echo=False)


class Base(DeclarativeBase):
    pass


# ── Tables ─────────────────────────────────────────────────────────────────────

class Bed(Base):
    __tablename__ = "beds"
    id            = Column(String, primary_key=True)
    ward          = Column(String, nullable=False)
    room_number   = Column(String)
    status        = Column(String, default="Available")   # Available/Occupied/Maintenance
    patient_id    = Column(String, nullable=True)
    assigned_date = Column(DateTime, nullable=True)


class Appointment(Base):
    __tablename__    = "appointments"
    id               = Column(String, primary_key=True)
    patient_id       = Column(String, nullable=False)
    doctor_id        = Column(String, nullable=False)
    appointment_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=30)
    type             = Column(String)                     # Consultation/Follow-up/Lab Review
    status           = Column(String, default="Scheduled")
    notes            = Column(Text)
    created_at       = Column(DateTime, default=datetime.utcnow)


class Billing(Base):
    __tablename__      = "billing"
    id                 = Column(String, primary_key=True)
    patient_id         = Column(String, nullable=False)
    encounter_id       = Column(String, nullable=False)
    total_amount       = Column(Float)
    insurance_covered  = Column(Float, default=0.0)
    patient_due        = Column(Float)
    status             = Column(String, default="Pending")  # Pending/Partial/Paid
    created_at         = Column(DateTime, default=datetime.utcnow)
    paid_at            = Column(DateTime, nullable=True)


class Alert(Base):
    __tablename__   = "alerts"
    id              = Column(String, primary_key=True)
    name            = Column(String, nullable=False)
    condition_sql   = Column(Text)
    threshold       = Column(Float)
    operator        = Column(String)                        # >, <, =, >=, <=
    message         = Column(Text)
    active          = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
    last_triggered  = Column(DateTime, nullable=True)
    history         = relationship("AlertHistory", back_populates="alert")


class AlertHistory(Base):
    __tablename__        = "alert_history"
    id                   = Column(String, primary_key=True)
    alert_id             = Column(String, ForeignKey("alerts.id"))
    triggered_at         = Column(DateTime, default=datetime.utcnow)
    value_at_trigger     = Column(Float)
    notification_sent    = Column(Boolean, default=False)
    alert                = relationship("Alert", back_populates="history")


class DashboardChart(Base):
    __tablename__ = "dashboard_charts"
    id            = Column(String, primary_key=True)
    title         = Column(String)
    chart_json    = Column(Text)   # Plotly JSON string
    chart_type    = Column(String)
    session_id    = Column(String)
    pinned_at     = Column(DateTime, default=datetime.utcnow)
    position_x    = Column(Integer, default=0)
    position_y    = Column(Integer, default=0)


class ChatHistory(Base):
    __tablename__  = "chat_history"
    id             = Column(String, primary_key=True)
    session_id     = Column(String, nullable=False)
    role           = Column(String)           # user/agent
    content        = Column(Text)
    message_type   = Column(String)           # text/chart/flowchart/table
    data_json      = Column(Text, nullable=True)
    is_favorite    = Column(Boolean, default=False)
    created_at     = Column(DateTime, default=datetime.utcnow)


class SMSLog(Base):
    __tablename__ = "sms_log"
    id            = Column(String, primary_key=True)
    recipient     = Column(String)
    message       = Column(Text)
    status        = Column(String, default="Pending")  # Sent/Failed/Pending
    sent_at       = Column(DateTime, default=datetime.utcnow)


# ── Main ───────────────────────────────────────────────────────────────────────

def create_all():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    print("✅  Operations database schema created (SQLite)")
    print("   Tables: beds, appointments, billing, alerts,")
    print("           alert_history, dashboard_charts, chat_history, sms_log")


if __name__ == "__main__":
    create_all()
