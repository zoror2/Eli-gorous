import pandas as pd
from faker import Faker
import random
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

# Load connection info from your .env file
load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))
fake = Faker('en_IN') # Using Indian locale as required

def seed_clinical_data():
    # --- Generate 1000 Patients ---
    patients = []
    for i in range(1000):
        patients.append({
            "id": f"P-2024-{i:04d}",
            "name": fake.name(),
            "age": random.randint(1, 90),
            "gender": random.choice(['Male', 'Female', 'Other']),
            "blood_type": random.choice(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']),
            "phone": fake.phone_number(),
            "email": fake.email(),
            "address": fake.address(),
            "registered_date": fake.date_this_year()
        })
    
    # Save patients to PostgreSQL
    df_patients = pd.DataFrame(patients)
    df_patients.to_sql('patients', engine, if_exists='replace', index=False)
    
    # --- Generate 10 Doctors ---
    doctors = []
    specialties = ['Cardiologist', 'Endocrinologist', 'Pulmonologist', 'General Physician']
    for i in range(10):
        doctors.append({
            "id": f"D-{i:04d}",
            "name": fake.name(),
            "specialization": random.choice(specialties),
            "phone": fake.phone_number()
        })
    
    df_doctors = pd.DataFrame(doctors)
    df_doctors.to_sql('doctors', engine, if_exists='replace', index=False)
    
    print("✅ Successfully added 1,000 Patients and 10 Doctors to clinical_db!")

if __name__ == "__main__":
    seed_clinical_data()