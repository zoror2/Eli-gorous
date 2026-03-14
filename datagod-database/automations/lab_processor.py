import sqlite3
import random

class LabProcessor:
    def __init__(self):
        # Connect to the Operations database to save our alerts
        self.ops_conn = sqlite3.connect('operations.db')
        
        # Define normal/safe ranges for lab tests
        self.thresholds = {
            "Glucose": {"max": 140},      # Above 140 is high
            "Hemoglobin": {"min": 12.0},  # Below 12.0 is low
            "Heart_Rate": {"max": 100}    # Above 100 is high
        }

    def process_lab_results(self, patient_id, lab_results):
        print(f"🔬 Processing lab results for {patient_id}...")
        cursor = self.ops_conn.cursor()
        
        alerts_generated = 0
        
        for test_name, value in lab_results.items():
            is_critical = False
            message = ""
            
            # Check for dangerously HIGH values
            if test_name in self.thresholds and "max" in self.thresholds[test_name]:
                if value > self.thresholds[test_name]["max"]:
                    is_critical = True
                    message = f"CRITICAL HIGH: {test_name} is {value} (Max safe: {self.thresholds[test_name]['max']})"
                    
            # Check for dangerously LOW values
            if test_name in self.thresholds and "min" in self.thresholds[test_name]:
                if value < self.thresholds[test_name]["min"]:
                    is_critical = True
                    message = f"CRITICAL LOW: {test_name} is {value} (Min safe: {self.thresholds[test_name]['min']})"
            
            # If critical, save an alert to the database
            if is_critical:
                print(f"⚠️ {message}")
                alert_id = f"ALT-{random.randint(1000, 9999)}"
                
                # Inserting the alert into the alerts table we created in Step 3!
                cursor.execute(
                    "INSERT INTO alerts (id, name, message, threshold) VALUES (?, ?, ?, ?)",
                    (alert_id, test_name, message, float(value))
                )
                alerts_generated += 1
            else:
                print(f"✅ {test_name} is normal ({value}).")
                
        self.ops_conn.commit()
        print(f"🏁 Lab processing complete. {alerts_generated} alerts saved to database.\n")


if __name__ == "__main__":
    processor = LabProcessor()
    
    # Mock data simulating what we extracted from a patient's Lab Report PDF
    mock_pdf_data = {
        "Glucose": 165,       # This is too high! (Should trigger alert)
        "Hemoglobin": 14.2,   # This is normal
        "Heart_Rate": 110     # This is too high! (Should trigger alert)
    }
    
    # Run the test
    processor.process_lab_results(patient_id="P-2024-1001", lab_results=mock_pdf_data)