import time
import re
import pandas as pd
from langchain.tools import tool
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
        
        # SQLite in this project uses single-file DBs without schema-qualified table names.
        # Normalize prefixes like clinical.table -> table to avoid runtime errors.
        run_sql = clean_sql
        if engine.dialect.name == "sqlite":
            run_sql = re.sub(r"\b(?:clinical|operations)\.([a-zA-Z_][a-zA-Z0-9_]*)", r"\1", run_sql)

        # Use pandas read_sql() for clean results as requested by the instructions
        df = pd.read_sql(run_sql, engine)
        
        execution_time_ms = int((time.time() - start_time) * 1000)
        
        raw_rows = df.values.tolist()
        note = f"Successfully fetched {len(df)} rows."
        
        # Truncate the rows to save LLM context window memory
        if len(raw_rows) > 10:
            raw_rows = raw_rows[:10]
            note = f"Fetched {len(df)} rows. Truncated to 10 rows for display. You can safely pass this exact SQL query to generate_chart to visualize all {len(df)} rows without needing to see them here."
        
        # 4. Format the output strictly to the requested JSON structure [cite: 13, 14]
        return {
            "sql": run_sql,
            "columns": df.columns.tolist(),
            "rows": raw_rows,
            "row_count": len(df),
            "execution_time_ms": execution_time_ms,
            "note": note
        }
        
    except Exception as e:
        # Catch SQL errors and return them gracefully so the AI can try fixing its own SQL! 
        return {"error": str(e), "sql": run_sql if 'run_sql' in locals() else clean_sql}