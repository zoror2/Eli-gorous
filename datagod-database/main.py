from fastapi import FastAPI
import sqlite3

# This creates your web server!
app = FastAPI(title="Hospital Management API")

@app.get("/")
def home():
    return {"message": "🏥 Welcome to the Hospital Management API!"}

@app.get("/beds/available")
def get_available_beds():
    print("Fetching available beds...")
    try:
        # Connect to the operations database
        conn = sqlite3.connect('operations.db')
        cursor = conn.cursor()
        
        # Find all beds that are available
        cursor.execute("SELECT id FROM beds WHERE status = 'Available'")
        beds = cursor.fetchall()
        conn.close()
        
        # Clean up the list format
        available_beds = [bed[0] for bed in beds]
        
        return {
            "status": "success",
            "available_count": len(available_beds),
            "beds": available_beds
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}