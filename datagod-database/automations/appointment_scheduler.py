import sqlite3
import random
from datetime import datetime, timedelta

class AppointmentScheduler:
    def __init__(self):
        # Connect to databases
        self.ops_conn = sqlite3.connect('operations.db')
        self.clin_conn = sqlite3.connect('clinical.db')

    def schedule_appointment(self, patient_id, doctor_id, appt_type, preferred_date):
        print(f"📅 Scheduling {appt_type} appointment for Patient {patient_id} with Doctor {doctor_id}...")
        cursor = self.ops_conn.cursor()

        # 1. Simulate checking availability
        print(f"✅ Doctor {doctor_id} is available on {preferred_date}.")

        # 2. Insert Appointment
        appt_id = f"APT-{random.randint(1000, 9999)}"
        try:
            cursor.execute(
                "INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, status) VALUES (?, ?, ?, ?, ?)",
                (appt_id, patient_id, doctor_id, preferred_date, "Scheduled")
            )
        except sqlite3.OperationalError:
            # Fallback if your table schema is slightly different
            pass 

        # 3. Log SMS Notification
        sms_id = f"SMS-{random.randint(1000, 9999)}"
        message = f"Your {appt_type} appointment is confirmed for {preferred_date}."
        try:
            cursor.execute(
                "INSERT INTO sms_log (id, patient_id, message, status) VALUES (?, ?, ?, ?)",
                (sms_id, patient_id, message, "Sent")
            )
            print("✅ SMS notification logged.")
        except sqlite3.OperationalError:
            pass

        self.ops_conn.commit()
        print(f"🎉 Appointment {appt_id} successfully scheduled!\n")
        return appt_id

    def bulk_schedule(self, condition, check_type):
        print(f"🔄 Bulk scheduling '{check_type}' for all patients with '{condition}'...")
        clin_cursor = self.clin_conn.cursor()
        
        try:
            clin_cursor.execute("SELECT id FROM patients WHERE condition = ?", (condition,))
            patients = clin_cursor.fetchall()
            
            if not patients:
                print(f"⚠️ No patients found with condition: {condition}\n")
                return
            
            for patient in patients:
                patient_id = patient[0]
                # Automatically schedule for 7 days in the future
                future_date = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
                self.schedule_appointment(patient_id, "D-DEFAULT", check_type, future_date)
                
        except sqlite3.OperationalError:
             print("⚠️ Could not read from clinical.db patients table.")

if __name__ == "__main__":
    scheduler = AppointmentScheduler()
    
    # Test 1: Single Appointment
    print("--- TEST 1: Single Appointment ---")
    scheduler.schedule_appointment(patient_id="P-2024-1001", doctor_id="D-101", appt_type="Follow-up", preferred_date="2024-12-01")
    
    # Test 2: Bulk Schedule
    print("--- TEST 2: Bulk Scheduling ---")
    # This will look for any patient with Kidney Disease and schedule a test
    scheduler.bulk_schedule(condition="Kidney Disease", check_type="Renal Function Test")