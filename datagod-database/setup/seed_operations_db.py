"""
seed_operations_db.py
Seeds the operations DB with 50 beds, 3 default alerts, and 20 sample appointments.
Run AFTER create_operations_db.py
"""

import os
import uuid
import random
from datetime import datetime, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

# Import models from create_operations_db
import sys
sys.path.insert(0, os.path.dirname(__file__))
from create_operations_db import Alert, AlertHistory, Appointment, Bed, Base

DB_URL = os.getenv("OPERATIONS_DB_URL", "sqlite:///./operations.db")
engine = create_engine(DB_URL, echo=False)

WARDS = ["ICU", "Cardiology", "General", "Emergency", "Pediatrics"]
WARD_COUNTS = {"ICU": 8, "Cardiology": 10, "General": 16, "Emergency": 10, "Pediatrics": 6}

# Sample patient/doctor IDs (matching clinical DB pattern)
SAMPLE_PATIENTS = [f"P-2024-{1000 + i:04d}" for i in range(50)]
SAMPLE_DOCTORS  = [f"D-{1000 + i:04d}" for i in range(20)]


def seed_beds(session: Session):
    beds = []
    for ward, count in WARD_COUNTS.items():
        for num in range(1, count + 1):
            is_occupied = random.random() < 0.45  # ~45% occupied
            beds.append(Bed(
                id=f"BED-{ward[:3].upper()}-{num:02d}",
                ward=ward,
                room_number=f"{ward[:1]}{num:02d}",
                status="Occupied" if is_occupied else "Available",
                patient_id=random.choice(SAMPLE_PATIENTS) if is_occupied else None,
                assigned_date=datetime.utcnow() - timedelta(days=random.randint(0, 14)) if is_occupied else None,
            ))
    session.add_all(beds)
    print(f"  ✓ {len(beds)} beds seeded")


def seed_alerts(session: Session):
    alerts = [
        Alert(
            id=f"ALR-{uuid.uuid4().hex[:8].upper()}",
            name="ICU Bed Capacity Warning",
            condition_sql="SELECT COUNT(*) FROM beds WHERE ward='ICU' AND status='Occupied'",
            threshold=0.80,
            operator=">=",
            message="⚠️  ICU beds are over 80% full — take action immediately.",
            active=True,
            created_at=datetime.utcnow(),
        ),
        Alert(
            id=f"ALR-{uuid.uuid4().hex[:8].upper()}",
            name="Critical Glucose Readings Today",
            condition_sql=(
                "SELECT COUNT(*) FROM lab_results "
                "WHERE test_name='Glucose' AND status='Critical' "
                "AND test_date >= date('now')"
            ),
            threshold=5,
            operator=">",
            message="🚨  More than 5 critical glucose readings today — review patients.",
            active=True,
            created_at=datetime.utcnow(),
        ),
        Alert(
            id=f"ALR-{uuid.uuid4().hex[:8].upper()}",
            name="Pending Insurance Claims Backlog",
            condition_sql="SELECT COUNT(*) FROM insurance WHERE claim_status='Pending'",
            threshold=20,
            operator=">",
            message="📋  Over 20 insurance claims still pending — follow up with providers.",
            active=True,
            created_at=datetime.utcnow(),
        ),
    ]
    session.add_all(alerts)
    print(f"  ✓ {len(alerts)} default alerts seeded")


def seed_appointments(session: Session):
    appt_types = ["Consultation", "Follow-up", "Lab Review"]
    appt_statuses = ["Scheduled", "Completed", "Cancelled", "No-show"]
    appointments = []
    for i in range(20):
        appt_date = datetime.utcnow() + timedelta(days=random.randint(-7, 30))
        appt_date = appt_date.replace(
            hour=random.choice(range(9, 17)),
            minute=random.choice([0, 30]),
            second=0, microsecond=0
        )
        appointments.append(Appointment(
            id=f"APT-{uuid.uuid4().hex[:10].upper()}",
            patient_id=random.choice(SAMPLE_PATIENTS),
            doctor_id=random.choice(SAMPLE_DOCTORS),
            appointment_date=appt_date,
            duration_minutes=30,
            type=random.choice(appt_types),
            status="Scheduled" if appt_date > datetime.utcnow() else random.choice(appt_statuses[1:]),
            notes=f"Sample appointment {i+1}",
            created_at=datetime.utcnow(),
        ))
    session.add_all(appointments)
    print(f"  ✓ {len(appointments)} sample appointments seeded")


def main():
    print("🌱  Seeding operations database …")
    with Session(engine) as session:
        seed_beds(session)
        seed_alerts(session)
        seed_appointments(session)
        session.commit()
    print("✅  Operations DB seeded successfully!")


if __name__ == "__main__":
    main()
