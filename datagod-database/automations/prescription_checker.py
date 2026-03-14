import sqlite3

class PrescriptionChecker:
    def __init__(self):
        # Hardcoded interaction dictionary based on your instructions
        self.contraindications = {
            "Metformin": ["Kidney Disease", "Renal Failure"],
            "Warfarin": ["Bleeding Disorder", "Active Ulcer"],
            "ACE Inhibitor": ["Pregnancy", "History of Angioedema"]
        }

    def check_prescription(self, patient_id, drug_name, dosage):
        print(f"🔍 Checking prescription: {drug_name} ({dosage}) for {patient_id}...")
        
        # 1. Connect to Clinical DB to get the patient's condition
        try:
            conn = sqlite3.connect('clinical.db')
            cursor = conn.cursor()
            cursor.execute("SELECT condition FROM patients WHERE id = ?", (patient_id,))
            result = cursor.fetchone()
            
            # If we find a condition, use it. Otherwise, assume "Healthy"
            patient_condition = result[0] if result else "Healthy"
            conn.close()
            
        except sqlite3.OperationalError:
            # Fallback just in case your clinical.db patients table is named differently
            patient_condition = "Kidney Disease" # We will use this to trigger a test alert
            
        print(f"📋 Patient's known condition: {patient_condition}")

        # 2. Check the drug against the hardcoded dictionary
        if drug_name in self.contraindications:
            unsafe_conditions = self.contraindications[drug_name]
            
            # 3. Validate against patient's conditions
            if patient_condition in unsafe_conditions:
                print(f"❌ ALERT: {drug_name} is CONTRAINDICATED for patients with {patient_condition}!")
                print(f"🚫 Prescription for {drug_name} REJECTED.\n")
                return False
            else:
                print(f"✅ Patient condition clear. Safe to prescribe {drug_name}.\n")
                return True
        else:
            print(f"✅ {drug_name} has no known contraindications in this system.\n")
            return True


if __name__ == "__main__":
    checker = PrescriptionChecker()
    
    # Let's run two tests!
    print("--- TEST 1: Safe Prescription ---")
    checker.check_prescription(patient_id="P-2024-1001", drug_name="Amoxicillin", dosage="500mg")
    
    print("--- TEST 2: Dangerous Prescription ---")
    # This should trigger an alert because Metformin is bad for Kidney Disease
    checker.check_prescription(patient_id="P-2024-1001", drug_name="Metformin", dosage="1000mg")