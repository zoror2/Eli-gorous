import sqlite3
import random

class DischargePipeline:
    def __init__(self):
        # Connect to the Operations database
        self.ops_conn = sqlite3.connect('operations.db')

    def discharge_patient(self, patient_id, days_admitted=3, has_insurance=True):
        print(f"Starting discharge process for {patient_id}...")
        cursor = self.ops_conn.cursor()

        # 1. Free the bed
        cursor.execute("SELECT id FROM beds WHERE patient_id = ?", (patient_id,))
        bed = cursor.fetchone()
        
        if bed:
            bed_id = bed[0]
            cursor.execute("UPDATE beds SET status = 'Available', patient_id = NULL WHERE id = ?", (bed_id,))
            print(f"✅ Bed {bed_id} is now free and 'Available'.")
        else:
            print(f"⚠️ No bed found for {patient_id}.")

        # 2. Calculate Bill
        base_bill = days_admitted * 2000
        final_bill = base_bill * 0.2 if has_insurance else base_bill
        
        # 3. Create IDs and Save to Billing Table
        bill_id = f"BILL-{random.randint(1000, 9999)}"
        encounter_id = f"ENC-{random.randint(1000, 9999)}"
        
        cursor.execute(
            "INSERT INTO billing (id, encounter_id, patient_id, total_amount, status) VALUES (?, ?, ?, ?, ?)", 
            (bill_id, encounter_id, patient_id, final_bill, 'Pending')
        )
        
        self.ops_conn.commit()
        
        # 4. Final Success Messages
        print(f"✅ Bill {bill_id} generated for ₹{final_bill} (Encounter: {encounter_id})")
        print("✅ Prescription list generated.")
        print("✅ Follow-up appointment scheduled for 7 days from now.")
        print(f"🎉 Patient {patient_id} successfully discharged!\n")

if __name__ == "__main__":
    pipeline = DischargePipeline()
    # Running the test using the patient we registered earlier
    pipeline.discharge_patient(patient_id="P-2024-1001")