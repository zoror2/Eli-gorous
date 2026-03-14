"""
patient_registration.py
PatientRegistration: registers new patients into clinical + operations DBs.
"""

import os
import uuid
import random
from datetime import datetime, timedelta

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

CLINICAL_URL   = os.getenv("CLINICAL_DB_URL", "postgresql://postgres:postgres@localhost:5432/clinical_db")
OPERATIONS_URL = os.getenv("OPERATIONS_DB_URL", "sqlite:///./operations.db")

clinical_engine   = create_engine(CLINICAL_URL)
operations_engine = create_engine(OPERATIONS_URL)


class PatientRegistration:
    """Handles end-to-end patient onboarding."""

    # Map condition → preferred specialization
    CONDITION_SPEC_MAP = {
        "Diabetes":       "Endocrinologist",
        "Heart Disease":  "Cardiologist",
        "Asthma":         "Pulmonologist",
        "Kidney Disease": "Nephrologist",
        "Hypertension":   "Cardiologist",
        "Anemia":         "General Physician",
        "Tuberculosis":   "Pulmonologist",
        "Dengue":         "General Physician",
        "Malaria":        "General Physician",
        "COVID-19":       "Pulmonologist",
    }

    def _generate_patient_id(self) -> str:
        year = datetime.now().year
        suffix = random.randint(1000, 9999)
        return f"P-{year}-{suffix}"

    def _find_doctor(self, conn, doctor_name: str = None, condition: str = None) -> dict | None:
        """Find a doctor by name or by specialization matching the condition."""
        if doctor_name:
            row = conn.execute(
                text("SELECT * FROM doctors WHERE name ILIKE :n LIMIT 1"),
                {"n": f"%{doctor_name}%"},
            ).mappings().fetchone()
            if row:
                return dict(row)

        if condition:
            spec = self.CONDITION_SPEC_MAP.get(condition, "General Physician")
            row = conn.execute(
                text("SELECT * FROM doctors WHERE specialization = :s ORDER BY RANDOM() LIMIT 1"),
                {"s": spec},
            ).mappings().fetchone()
            if row:
                return dict(row)

        # Fallback: any doctor
        row = conn.execute(text("SELECT * FROM doctors ORDER BY RANDOM() LIMIT 1")).mappings().fetchone()
        return dict(row) if row else None

    def _find_appointment_slot(self, doctor_id: str, from_date: datetime = None) -> datetime:
        """Find the next open 30-min slot for the doctor."""
        from_date = from_date or (datetime.now() + timedelta(days=1))
        from_date = from_date.replace(hour=9, minute=0, second=0, microsecond=0)

        with Session(operations_engine) as ops_session:
            for day_offset in range(14):
                candidate = from_date + timedelta(days=day_offset)
                # Skip weekends
                if candidate.weekday() >= 5:
                    continue
                booked = ops_session.execute(
                    text(
                        "SELECT appointment_date FROM appointments "
                        "WHERE doctor_id = :did AND date(appointment_date) = date(:d) "
                        "AND status = 'Scheduled'"
                    ),
                    {"did": doctor_id, "d": candidate.date().isoformat()},
                ).fetchall()
                booked_times = {r[0] for r in booked}

                for hour in range(9, 17):
                    for minute in [0, 30]:
                        slot = candidate.replace(hour=hour, minute=minute)
                        if slot not in booked_times:
                            return slot
        # If nothing found in 14 days, return +15 days
        return from_date + timedelta(days=15)

    def _log_sms(self, ops_session: Session, recipient: str, message: str):
        ops_session.execute(
            text(
                "INSERT INTO sms_log (id, recipient, message, status, sent_at) "
                "VALUES (:id, :r, :m, 'Pending', :t)"
            ),
            {"id": f"SMS-{uuid.uuid4().hex[:10].upper()}", "r": recipient, "m": message, "t": datetime.utcnow()},
        )

    def register_patient(
        self,
        name: str,
        age: int,
        gender: str,
        condition: str = None,
        doctor_name: str = None,
        phone: str = None,
        email: str = None,
        blood_type: str = "O+",
        address: str = "Not Provided",
    ) -> dict:
        actions_completed = []
        patient_id = self._generate_patient_id()

        with clinical_engine.begin() as conn:
            # 1. Find doctor
            doctor = self._find_doctor(conn, doctor_name, condition)
            doctor_id   = doctor["id"]   if doctor else None
            doctor_disp = doctor["name"] if doctor else "Unassigned"

            # 2. Insert patient
            conn.execute(
                text("""
                    INSERT INTO patients
                    (id, name, age, gender, blood_type, phone, email,
                     address, emergency_contact, registered_date, insurance_id)
                    VALUES
                    (:id, :name, :age, :gender, :bt, :phone, :email,
                     :addr, :ec, :rd, :ins)
                """),
                {
                    "id": patient_id, "name": name, "age": age, "gender": gender,
                    "bt": blood_type, "phone": phone or "N/A",
                    "email": email or f"{name.lower().replace(' ', '.')}@example.com",
                    "addr": address, "ec": "N/A",
                    "rd": datetime.utcnow().date().isoformat(),
                    "ins": f"INS-{uuid.uuid4().hex[:8].upper()}",
                },
            )
            actions_completed.append("registered")

            # 3. Insert condition
            condition_id = None
            if condition:
                condition_id = f"COND-{uuid.uuid4().hex[:10].upper()}"
                conn.execute(
                    text("""
                        INSERT INTO conditions
                        (id, patient_id, condition_name, diagnosed_date, severity, status, doctor_id)
                        VALUES (:id, :pid, :cname, :dd, 'Mild', 'Active', :did)
                    """),
                    {"id": condition_id, "pid": patient_id, "cname": condition,
                     "dd": datetime.utcnow().date().isoformat(), "did": doctor_id},
                )
                actions_completed.append("condition_filed")

        # 4. Schedule appointment (operations DB)
        slot = self._find_appointment_slot(doctor_id) if doctor_id else datetime.now() + timedelta(days=3)
        appointment_id = f"APT-{uuid.uuid4().hex[:10].upper()}"

        with Session(operations_engine) as ops_session:
            ops_session.execute(
                text("""
                    INSERT INTO appointments
                    (id, patient_id, doctor_id, appointment_date, duration_minutes,
                     type, status, notes, created_at)
                    VALUES
                    (:id, :pid, :did, :dt, 30, 'Consultation', 'Scheduled', :notes, :ca)
                """),
                {
                    "id": appointment_id, "pid": patient_id, "did": doctor_id,
                    "dt": slot, "notes": f"Initial consultation for {condition or 'general check-up'}",
                    "ca": datetime.utcnow(),
                },
            )
            actions_completed.append("appointment_scheduled")

            # 5. Log SMS
            sms_msg = (
                f"Welcome {name}! Your patient ID is {patient_id}. "
                f"Your appointment with {doctor_disp} is on "
                f"{slot.strftime('%Y-%m-%d at %I:%M %p')}. "
                f"— DataGod Health"
            )
            self._log_sms(ops_session, phone or "N/A", sms_msg)
            actions_completed.append("sms_queued")
            ops_session.commit()

        return {
            "patient_id":       patient_id,
            "patient_name":     name,
            "doctor_assigned":  doctor_disp,
            "appointment":      slot.strftime("%Y-%m-%d %I:%M %p"),
            "appointment_id":   appointment_id,
            "condition":        condition,
            "actions_completed": actions_completed,
            "message":          "Patient registered successfully",
        }


# ── Quick test ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    reg = PatientRegistration()
    result = reg.register_patient(
        name="Arjun Sharma",
        age=45,
        gender="Male",
        condition="Diabetes",
        phone="9876543210",
    )
    import json
    print(json.dumps(result, indent=2))
