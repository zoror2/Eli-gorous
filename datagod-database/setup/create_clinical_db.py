"""
create_clinical_db.py
Generates synthetic clinical data and populates PostgreSQL (clinical_db).
Run after: CREATE DATABASE clinical_db; inside psql
"""

import os
import random
import uuid
from datetime import datetime, timedelta, date

import pandas as pd
from faker import Faker
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
fake = Faker("en_IN")
random.seed(42)
Faker.seed(42)

DB_URL = os.getenv("CLINICAL_DB_URL", "postgresql://postgres:postgres@localhost:5432/clinical_db")
engine = create_engine(DB_URL)

# ── Constants ──────────────────────────────────────────────────────────────────
BLOOD_TYPES      = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
CONDITIONS_LIST  = ["Diabetes", "Hypertension", "Asthma", "Heart Disease",
                    "Kidney Disease", "Anemia", "Tuberculosis", "Dengue",
                    "Malaria", "COVID-19"]
SEVERITY_LEVELS  = ["Mild", "Moderate", "Severe"]
CONDITION_STATUS = ["Active", "Resolved", "Chronic"]
SPECIALIZATIONS  = ["Cardiologist", "Endocrinologist", "Pulmonologist",
                    "Nephrologist", "General Physician", "Neurologist"]
DEPARTMENTS      = ["Cardiology", "Endocrinology", "Pulmonology",
                    "Nephrology", "General", "Neurology"]
VISIT_TYPES      = ["Inpatient", "Outpatient", "Emergency"]
ENC_DEPTS        = ["ICU", "Cardiology", "General", "Emergency"]
ENC_STATUS       = ["Active", "Discharged", "Transferred"]
DRUG_NAMES       = ["Metformin 500mg", "Amlodipine 5mg", "Atorvastatin 10mg",
                    "Aspirin 75mg", "Lisinopril 10mg", "Omeprazole 20mg",
                    "Azithromycin 500mg", "Paracetamol 500mg",
                    "Warfarin 5mg", "Insulin Glargine"]
FREQUENCIES      = ["Once daily", "Twice daily", "Thrice daily"]
MED_STATUS       = ["Active", "Completed", "Discontinued"]
LAB_TESTS = {
    "Glucose":      {"unit": "mg/dL",  "min": 70,   "max": 100,  "crit_high": 400, "crit_low": 50},
    "HbA1c":        {"unit": "%",      "min": 4,    "max": 5.7,  "crit_high": 10,  "crit_low": None},
    "BP_Systolic":  {"unit": "mmHg",   "min": 90,   "max": 120,  "crit_high": 180, "crit_low": 80},
    "Creatinine":   {"unit": "mg/dL",  "min": 0.6,  "max": 1.2,  "crit_high": 3.0, "crit_low": None},
    "Hemoglobin":   {"unit": "g/dL",   "min": 12,   "max": 17,   "crit_high": 20,  "crit_low": 7},
    "WBC":          {"unit": "K/uL",   "min": 4.5,  "max": 11.0, "crit_high": 30,  "crit_low": 2},
}
INSURANCE_PROVIDERS = ["Star Health", "HDFC Ergo", "LIC", "Government"]
CLAIM_STATUS        = ["Pending", "Approved", "Rejected", "Not Filed"]


def rdate(start_days_ago=365 * 3, end_days_ago=0) -> date:
    """Random date between start_days_ago and end_days_ago."""
    delta = random.randint(end_days_ago, start_days_ago)
    return (datetime.now() - timedelta(days=delta)).date()


def rdatetime(start_days_ago=365, end_days_ago=0) -> datetime:
    delta = random.randint(end_days_ago, start_days_ago)
    hour  = random.randint(0, 23)
    minute = random.choice([0, 15, 30, 45])
    return datetime.now() - timedelta(days=delta, hours=hour, minutes=minute)


# ── 1. Doctors ─────────────────────────────────────────────────────────────────
def generate_doctors(n: int = 20) -> pd.DataFrame:
    rows = []
    for i in range(n):
        spec_idx = i % len(SPECIALIZATIONS)
        rows.append({
            "id":                  f"D-{1000 + i:04d}",
            "name":                f"Dr. {fake.last_name()} {fake.first_name()}",
            "specialization":      SPECIALIZATIONS[spec_idx],
            "department":          DEPARTMENTS[spec_idx],
            "phone":               fake.phone_number()[:15],
            "available_days":      "Mon,Tue,Wed,Thu,Fri",
            "max_patients_per_day": random.randint(10, 25),
        })
    return pd.DataFrame(rows)


# ── 2. Patients ────────────────────────────────────────────────────────────────
def generate_patients(n: int = 1000) -> pd.DataFrame:
    rows = []
    for i in range(n):
        rows.append({
            "id":                f"P-2024-{1000 + i:04d}",
            "name":              fake.name(),
            "age":               random.randint(5, 90),
            "gender":            random.choice(["Male", "Female", "Other"]),
            "blood_type":        random.choice(BLOOD_TYPES),
            "phone":             fake.phone_number()[:15],
            "email":             fake.email(),
            "address":           fake.address().replace("\n", ", ")[:200],
            "emergency_contact": fake.phone_number()[:15],
            "registered_date":   rdate(365 * 4),
            "insurance_id":      f"INS-{uuid.uuid4().hex[:8].upper()}",
        })
    return pd.DataFrame(rows)


# ── 3. Conditions ──────────────────────────────────────────────────────────────
def generate_conditions(patients_df: pd.DataFrame, doctors_df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    patient_ids = patients_df["id"].tolist()
    doctor_ids  = doctors_df["id"].tolist()
    for pid in patient_ids:
        n_conds = random.choices([1, 2, 3], weights=[60, 30, 10])[0]
        for cond in random.sample(CONDITIONS_LIST, n_conds):
            diag_date = rdate(365 * 3)
            rows.append({
                "id":             f"COND-{uuid.uuid4().hex[:10].upper()}",
                "patient_id":     pid,
                "condition_name": cond,
                "diagnosed_date": diag_date,
                "severity":       random.choice(SEVERITY_LEVELS),
                "status":         random.choice(CONDITION_STATUS),
                "doctor_id":      random.choice(doctor_ids),
            })
    return pd.DataFrame(rows)


# ── 4. Encounters ──────────────────────────────────────────────────────────────
def generate_encounters(patients_df: pd.DataFrame, doctors_df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    patient_ids = patients_df["id"].tolist()
    doctor_ids  = doctors_df["id"].tolist()
    for pid in random.sample(patient_ids, min(1000, len(patient_ids))):
        admit_dt = rdatetime(365)
        discharged = random.random() > 0.2
        discharge_dt = (admit_dt + timedelta(days=random.randint(1, 14))) if discharged else None
        enc_status = "Discharged" if discharged else random.choice(["Active", "Transferred"])
        rows.append({
            "id":              f"ENC-{uuid.uuid4().hex[:10].upper()}",
            "patient_id":      pid,
            "doctor_id":       random.choice(doctor_ids),
            "admission_date":  admit_dt,
            "discharge_date":  discharge_dt,
            "department":      random.choice(ENC_DEPTS),
            "visit_type":      random.choice(VISIT_TYPES),
            "chief_complaint": fake.sentence(nb_words=8),
            "status":          enc_status,
        })
    return pd.DataFrame(rows)


# ── 5. Medications ─────────────────────────────────────────────────────────────
def generate_medications(patients_df: pd.DataFrame, doctors_df: pd.DataFrame,
                         encounters_df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    patient_ids  = patients_df["id"].tolist()
    doctor_ids   = doctors_df["id"].tolist()
    encounter_ids = encounters_df["id"].tolist()
    for pid in random.sample(patient_ids, min(1000, len(patient_ids))):
        n_meds = random.randint(1, 4)
        for drug in random.sample(DRUG_NAMES, n_meds):
            start = rdate(180)
            rows.append({
                "id":           f"MED-{uuid.uuid4().hex[:10].upper()}",
                "patient_id":   pid,
                "doctor_id":    random.choice(doctor_ids),
                "encounter_id": random.choice(encounter_ids),
                "drug_name":    drug.split()[0],
                "dosage":       drug,
                "frequency":    random.choice(FREQUENCIES),
                "start_date":   start,
                "end_date":     start + timedelta(days=random.randint(7, 90)),
                "status":       random.choice(MED_STATUS),
            })
    return pd.DataFrame(rows)


# ── 6. Lab Results ─────────────────────────────────────────────────────────────
def _lab_status(value: float, info: dict) -> str:
    if info.get("crit_high") and value >= info["crit_high"]:
        return "Critical"
    if info.get("crit_low") and value <= info["crit_low"]:
        return "Critical"
    if value > info["max"]:
        return "High"
    if value < info["min"]:
        return "Low"
    return "Normal"


def generate_lab_results(patients_df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    patient_ids = patients_df["id"].tolist()
    for pid in patient_ids:
        n_tests = random.randint(1, 4)
        for test_name in random.sample(list(LAB_TESTS.keys()), n_tests):
            info  = LAB_TESTS[test_name]
            # Mostly normal range, occasional outliers
            lo, hi = info["min"] * 0.5, info["max"] * 2.5
            value = round(random.uniform(lo, hi), 2)
            rows.append({
                "id":            f"LAB-{uuid.uuid4().hex[:10].upper()}",
                "patient_id":    pid,
                "test_name":     test_name,
                "value":         value,
                "unit":          info["unit"],
                "normal_min":    info["min"],
                "normal_max":    info["max"],
                "status":        _lab_status(value, info),
                "test_date":     rdatetime(180),
                "technician_id": f"TECH-{random.randint(1, 20):03d}",
            })
    return pd.DataFrame(rows)


# ── 7. Insurance ───────────────────────────────────────────────────────────────
def generate_insurance(patients_df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for pid in patients_df["id"].tolist():
        coverage = round(random.uniform(50000, 500000), 2)
        status   = random.choice(CLAIM_STATUS)
        filed    = rdate(365) if status != "Not Filed" else None
        resolved = (filed + timedelta(days=random.randint(10, 60))) if status in ("Approved", "Rejected") and filed else None
        rows.append({
            "id":             f"INS-{uuid.uuid4().hex[:10].upper()}",
            "patient_id":     pid,
            "provider":       random.choice(INSURANCE_PROVIDERS),
            "policy_number":  f"POL-{uuid.uuid4().hex[:8].upper()}",
            "coverage_amount": coverage,
            "claim_status":   status,
            "claim_amount":   round(random.uniform(5000, coverage), 2) if status != "Not Filed" else 0.0,
            "filed_date":     filed,
            "resolved_date":  resolved,
        })
    return pd.DataFrame(rows)


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print("🏥  DataGod Health — Clinical DB Setup")
    print("=" * 45)

    print("Generating doctors …")
    doctors_df    = generate_doctors(20)

    print("Generating patients (1 000) …")
    patients_df   = generate_patients(1000)

    print("Generating conditions …")
    conditions_df = generate_conditions(patients_df, doctors_df)

    print("Generating encounters …")
    encounters_df = generate_encounters(patients_df, doctors_df)

    print("Generating medications …")
    medications_df = generate_medications(patients_df, doctors_df, encounters_df)

    print("Generating lab results …")
    lab_df        = generate_lab_results(patients_df)

    print("Generating insurance records …")
    insurance_df  = generate_insurance(patients_df)

    # ── Load into PostgreSQL ───────────────────────────────────────────────────
    tables = {
        "doctors":    doctors_df,
        "patients":   patients_df,
        "conditions": conditions_df,
        "encounters": encounters_df,
        "medications": medications_df,
        "lab_results": lab_df,
        "insurance":  insurance_df,
    }

    with engine.begin() as conn:
        # Drop in reverse FK order
        for tbl in reversed(list(tables.keys())):
            conn.execute(text(f"DROP TABLE IF EXISTS {tbl} CASCADE"))

    for name, df in tables.items():
        print(f"  ↑ Loading {name} ({len(df):,} rows) …")
        df.to_sql(name, engine, if_exists="replace", index=False)

    print("\n✅  Clinical database populated successfully!")
    print(f"   patients   : {len(patients_df):,}")
    print(f"   doctors    : {len(doctors_df):,}")
    print(f"   conditions : {len(conditions_df):,}")
    print(f"   encounters : {len(encounters_df):,}")
    print(f"   medications: {len(medications_df):,}")
    print(f"   lab_results: {len(lab_df):,}")
    print(f"   insurance  : {len(insurance_df):,}")


if __name__ == "__main__":
    main()
