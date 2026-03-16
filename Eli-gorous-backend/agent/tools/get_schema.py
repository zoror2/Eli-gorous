from langchain_core.tools import tool
from database.connection import db_manager

@tool
def get_schema(database: str = "all") -> dict:
    """
    Retrieves the complete database schema including all tables,
    columns, data types, and foreign key relationships.
    
    Args:
        database: "clinical", "operations", or "all" (default)
    
    Returns:
        JSON with tables, columns, types, and relationships
    """
    # Our db_manager from Step 4 already has a method that reads the databases!
    all_schemas = db_manager.get_all_schemas()
    
    # The instructions asked for a specific JSON format
    result = {"databases": {}}
    
    if database.lower() == "clinical":
        result["databases"]["clinical"] = {"tables": all_schemas.get("clinical", {})}
    elif database.lower() == "operations":
        result["databases"]["operations"] = {"tables": all_schemas.get("operations", {})}
    else:
        # Return both if "all" is requested
        result["databases"]["clinical"] = {"tables": all_schemas.get("clinical", {})}
        result["databases"]["operations"] = {"tables": all_schemas.get("operations", {})}
        
    return result