import time
import pandas as pd
from langchain_core.tools import tool
from database.connection import db_manager

@tool  
def execute_query(sql: str, database: str = "clinical") -> dict:
    """
    Executes a SQL query against the specified database and 
    returns results. Always show the SQL to user before running.
    
    Args:
        sql: Valid SQL query string
        database: "clinical" or "operations"
    
    Returns:
        Dict with sql, columns, rows, row_count, and execution_time_ms
    """
    # 1. Safety First! NEVER allow destructive commands.
    clean_sql = sql.strip()
    upper_sql = clean_sql.upper()
    
    # Validate SQL starts with SELECT only 
    if not upper_sql.startswith("SELECT"):
        return {"error": "Security violation: Only SELECT queries are allowed.", "sql": sql}
        
    # Block anything that alters the database 
    forbidden_keywords = ["DELETE", "DROP", "ALTER", "UPDATE", "INSERT", "TRUNCATE"]
    for keyword in forbidden_keywords:
        # Check for the word with a space to avoid catching words like "SELECT * FROM my_drops"
        if f"{keyword} " in upper_sql:
            return {"error": f"Security violation: {keyword} statements are strictly prohibited.", "sql": sql}

    # 2. Limit results to 1000 rows max to prevent crashing the chat UI 
    if "LIMIT" not in upper_sql:
        # Remove trailing semicolon if it exists before adding LIMIT
        clean_sql = clean_sql.rstrip(';')
        clean_sql = f"{clean_sql} LIMIT 1000"

    # 3. Execute and measure time 
    start_time = time.time()
    
    try:
        # Get the correct engine from our manager
        engine = db_manager.get_engine(database)
        
        # Use pandas read_sql() for clean results as requested by the instructions 
        df = pd.read_sql(clean_sql, engine)
        
        execution_time_ms = int((time.time() - start_time) * 1000)
        
        # 4. Format the output strictly to the requested JSON structure [cite: 13, 14]
        return {
            "sql": clean_sql,
            "columns": df.columns.tolist(),
            "rows": df.values.tolist(),
            "row_count": len(df),
            "execution_time_ms": execution_time_ms
        }
        
    except Exception as e:
        # Catch SQL errors and return them gracefully so the AI can try fixing its own SQL! 
        return {"error": str(e), "sql": clean_sql}