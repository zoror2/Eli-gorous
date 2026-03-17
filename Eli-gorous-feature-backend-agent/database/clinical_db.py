"""
Clinical database setup.
Creates sample clinical tables in SQLite for development/demo purposes.
In production, this would connect to a real PostgreSQL database with Synthea/Kaggle data.
"""
from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, ForeignKey,
    create_engine, MetaData, Table, text
)
from sqlalchemy.orm import declarative_base
from database.connection import db_manager
import datetime

Base = declarative_base()


def seed_clinical_db():
    """Create sample clinical tables and seed with demo data."""
    engine = db_manager.get_engine("clinical")
    if engine is None:
        print("Clinical engine not available, skipping seed.")
        return

    metadata = MetaData()

    # Define tables
    patients = Table(
        "patients", metadata,
        Column("id", Integer, primary_key=True),
        Column("first_name", String),
        Column("last_name", String),
        Column("gender", String),
        Column("birth_date", String),
        Column("city", String),
        Column("state", String),
        Column("zip", String),
    )

    encounters = Table(
        "encounters", metadata,
        Column("id", Integer, primary_key=True),
        Column("patient_id", Integer, ForeignKey("patients.id")),
        Column("encounter_date", String),
        Column("encounter_type", String),
        Column("department", String),
        Column("provider", String),
        Column("cost", Float),
    )

    conditions = Table(
        "conditions", metadata,
        Column("id", Integer, primary_key=True),
        Column("patient_id", Integer, ForeignKey("patients.id")),
        Column("encounter_id", Integer, ForeignKey("encounters.id")),
        Column("condition_code", String),
        Column("condition_name", String),
        Column("onset_date", String),
        Column("resolved_date", String),
    )

    medications = Table(
        "medications", metadata,
        Column("id", Integer, primary_key=True),
        Column("patient_id", Integer, ForeignKey("patients.id")),
        Column("encounter_id", Integer, ForeignKey("encounters.id")),
        Column("medication_name", String),
        Column("dosage", String),
        Column("start_date", String),
        Column("end_date", String),
        Column("cost", Float),
    )

    observations = Table(
        "observations", metadata,
        Column("id", Integer, primary_key=True),
        Column("patient_id", Integer, ForeignKey("patients.id")),
        Column("encounter_id", Integer, ForeignKey("encounters.id")),
        Column("observation_type", String),
        Column("value", Float),
        Column("unit", String),
        Column("observation_date", String),
    )

    # Create all tables
    metadata.create_all(engine)

    # Seed with sample data if tables are empty
    with engine.connect() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM patients")).scalar()
        if count > 0:
            return  # Already seeded

        # Sample patients
        conn.execute(patients.insert(), [
            {"id": 1, "first_name": "John", "last_name": "Doe", "gender": "M", "birth_date": "1985-03-15", "city": "Boston", "state": "MA", "zip": "02101"},
            {"id": 2, "first_name": "Jane", "last_name": "Smith", "gender": "F", "birth_date": "1990-07-22", "city": "Cambridge", "state": "MA", "zip": "02139"},
            {"id": 3, "first_name": "Robert", "last_name": "Johnson", "gender": "M", "birth_date": "1978-11-05", "city": "Worcester", "state": "MA", "zip": "01608"},
            {"id": 4, "first_name": "Emily", "last_name": "Williams", "gender": "F", "birth_date": "1995-01-30", "city": "Springfield", "state": "MA", "zip": "01103"},
            {"id": 5, "first_name": "Michael", "last_name": "Brown", "gender": "M", "birth_date": "1960-06-18", "city": "Boston", "state": "MA", "zip": "02102"},
            {"id": 6, "first_name": "Sarah", "last_name": "Davis", "gender": "F", "birth_date": "1972-09-08", "city": "Lowell", "state": "MA", "zip": "01851"},
            {"id": 7, "first_name": "David", "last_name": "Martinez", "gender": "M", "birth_date": "1988-12-25", "city": "Boston", "state": "MA", "zip": "02103"},
            {"id": 8, "first_name": "Lisa", "last_name": "Anderson", "gender": "F", "birth_date": "1965-04-12", "city": "Cambridge", "state": "MA", "zip": "02140"},
            {"id": 9, "first_name": "James", "last_name": "Taylor", "gender": "M", "birth_date": "2000-08-01", "city": "Newton", "state": "MA", "zip": "02458"},
            {"id": 10, "first_name": "Maria", "last_name": "Garcia", "gender": "F", "birth_date": "1982-02-14", "city": "Quincy", "state": "MA", "zip": "02169"},
        ])

        # Sample encounters
        conn.execute(encounters.insert(), [
            {"id": 1, "patient_id": 1, "encounter_date": "2024-01-10", "encounter_type": "outpatient", "department": "Cardiology", "provider": "Dr. Adams", "cost": 250.00},
            {"id": 2, "patient_id": 2, "encounter_date": "2024-01-12", "encounter_type": "inpatient", "department": "ICU", "provider": "Dr. Baker", "cost": 5200.00},
            {"id": 3, "patient_id": 3, "encounter_date": "2024-01-15", "encounter_type": "outpatient", "department": "Orthopedics", "provider": "Dr. Clark", "cost": 350.00},
            {"id": 4, "patient_id": 4, "encounter_date": "2024-02-01", "encounter_type": "emergency", "department": "Emergency", "provider": "Dr. Davis", "cost": 1800.00},
            {"id": 5, "patient_id": 5, "encounter_date": "2024-02-05", "encounter_type": "inpatient", "department": "ICU", "provider": "Dr. Evans", "cost": 8500.00},
            {"id": 6, "patient_id": 6, "encounter_date": "2024-02-10", "encounter_type": "outpatient", "department": "Dermatology", "provider": "Dr. Foster", "cost": 150.00},
            {"id": 7, "patient_id": 7, "encounter_date": "2024-02-14", "encounter_type": "outpatient", "department": "Cardiology", "provider": "Dr. Adams", "cost": 300.00},
            {"id": 8, "patient_id": 1, "encounter_date": "2024-03-01", "encounter_type": "outpatient", "department": "Cardiology", "provider": "Dr. Adams", "cost": 275.00},
            {"id": 9, "patient_id": 8, "encounter_date": "2024-03-05", "encounter_type": "inpatient", "department": "Neurology", "provider": "Dr. Grant", "cost": 4200.00},
            {"id": 10, "patient_id": 9, "encounter_date": "2024-03-10", "encounter_type": "outpatient", "department": "Pediatrics", "provider": "Dr. Harris", "cost": 180.00},
            {"id": 11, "patient_id": 10, "encounter_date": "2024-03-15", "encounter_type": "emergency", "department": "Emergency", "provider": "Dr. Davis", "cost": 2100.00},
            {"id": 12, "patient_id": 2, "encounter_date": "2024-03-20", "encounter_type": "outpatient", "department": "Oncology", "provider": "Dr. Irving", "cost": 600.00},
        ])

        # Sample conditions
        conn.execute(conditions.insert(), [
            {"id": 1, "patient_id": 1, "encounter_id": 1, "condition_code": "I10", "condition_name": "Hypertension", "onset_date": "2020-05-01", "resolved_date": None},
            {"id": 2, "patient_id": 2, "encounter_id": 2, "condition_code": "J18.9", "condition_name": "Pneumonia", "onset_date": "2024-01-12", "resolved_date": "2024-01-20"},
            {"id": 3, "patient_id": 3, "encounter_id": 3, "condition_code": "M54.5", "condition_name": "Low back pain", "onset_date": "2024-01-15", "resolved_date": None},
            {"id": 4, "patient_id": 4, "encounter_id": 4, "condition_code": "K35.80", "condition_name": "Acute appendicitis", "onset_date": "2024-02-01", "resolved_date": "2024-02-03"},
            {"id": 5, "patient_id": 5, "encounter_id": 5, "condition_code": "I21.9", "condition_name": "Acute myocardial infarction", "onset_date": "2024-02-05", "resolved_date": "2024-02-15"},
            {"id": 6, "patient_id": 6, "encounter_id": 6, "condition_code": "L40.0", "condition_name": "Psoriasis", "onset_date": "2023-06-01", "resolved_date": None},
            {"id": 7, "patient_id": 7, "encounter_id": 7, "condition_code": "E11.9", "condition_name": "Type 2 diabetes mellitus", "onset_date": "2022-03-10", "resolved_date": None},
            {"id": 8, "patient_id": 1, "encounter_id": 8, "condition_code": "E78.5", "condition_name": "Hyperlipidemia", "onset_date": "2024-03-01", "resolved_date": None},
            {"id": 9, "patient_id": 8, "encounter_id": 9, "condition_code": "G43.909", "condition_name": "Migraine", "onset_date": "2024-03-05", "resolved_date": "2024-03-08"},
            {"id": 10, "patient_id": 10, "encounter_id": 11, "condition_code": "S52.501A", "condition_name": "Fracture of lower end of radius", "onset_date": "2024-03-15", "resolved_date": "2024-04-15"},
        ])

        # Sample medications
        conn.execute(medications.insert(), [
            {"id": 1, "patient_id": 1, "encounter_id": 1, "medication_name": "Lisinopril", "dosage": "10mg daily", "start_date": "2020-05-01", "end_date": None, "cost": 15.00},
            {"id": 2, "patient_id": 2, "encounter_id": 2, "medication_name": "Amoxicillin", "dosage": "500mg 3x/day", "start_date": "2024-01-12", "end_date": "2024-01-22", "cost": 25.00},
            {"id": 3, "patient_id": 5, "encounter_id": 5, "medication_name": "Aspirin", "dosage": "81mg daily", "start_date": "2024-02-05", "end_date": None, "cost": 8.00},
            {"id": 4, "patient_id": 5, "encounter_id": 5, "medication_name": "Metoprolol", "dosage": "50mg 2x/day", "start_date": "2024-02-05", "end_date": None, "cost": 22.00},
            {"id": 5, "patient_id": 7, "encounter_id": 7, "medication_name": "Metformin", "dosage": "500mg 2x/day", "start_date": "2022-03-10", "end_date": None, "cost": 12.00},
            {"id": 6, "patient_id": 1, "encounter_id": 8, "medication_name": "Atorvastatin", "dosage": "20mg daily", "start_date": "2024-03-01", "end_date": None, "cost": 18.00},
            {"id": 7, "patient_id": 8, "encounter_id": 9, "medication_name": "Sumatriptan", "dosage": "50mg as needed", "start_date": "2024-03-05", "end_date": "2024-03-08", "cost": 35.00},
        ])

        # Sample observations (vitals/labs)
        conn.execute(observations.insert(), [
            {"id": 1, "patient_id": 1, "encounter_id": 1, "observation_type": "Blood Pressure Systolic", "value": 145.0, "unit": "mmHg", "observation_date": "2024-01-10"},
            {"id": 2, "patient_id": 1, "encounter_id": 1, "observation_type": "Blood Pressure Diastolic", "value": 92.0, "unit": "mmHg", "observation_date": "2024-01-10"},
            {"id": 3, "patient_id": 1, "encounter_id": 1, "observation_type": "Heart Rate", "value": 78.0, "unit": "bpm", "observation_date": "2024-01-10"},
            {"id": 4, "patient_id": 2, "encounter_id": 2, "observation_type": "Temperature", "value": 102.4, "unit": "F", "observation_date": "2024-01-12"},
            {"id": 5, "patient_id": 2, "encounter_id": 2, "observation_type": "White Blood Cell Count", "value": 15200.0, "unit": "cells/mcL", "observation_date": "2024-01-12"},
            {"id": 6, "patient_id": 5, "encounter_id": 5, "observation_type": "Troponin", "value": 2.8, "unit": "ng/mL", "observation_date": "2024-02-05"},
            {"id": 7, "patient_id": 5, "encounter_id": 5, "observation_type": "Blood Pressure Systolic", "value": 168.0, "unit": "mmHg", "observation_date": "2024-02-05"},
            {"id": 8, "patient_id": 7, "encounter_id": 7, "observation_type": "HbA1c", "value": 7.2, "unit": "%", "observation_date": "2024-02-14"},
            {"id": 9, "patient_id": 7, "encounter_id": 7, "observation_type": "Glucose", "value": 165.0, "unit": "mg/dL", "observation_date": "2024-02-14"},
            {"id": 10, "patient_id": 9, "encounter_id": 10, "observation_type": "BMI", "value": 22.5, "unit": "kg/m2", "observation_date": "2024-03-10"},
        ])

        conn.commit()
        print("Clinical database seeded with sample data.")
