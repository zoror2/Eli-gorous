import os
from sqlalchemy import create_engine, inspect, text
from dotenv import load_dotenv

# Load variables from the .env file
load_dotenv()


class DBConnectionManager:
    def __init__(self):
        # Get the URLs from your .env file
        clinical_url = os.getenv("CLINICAL_DB_URL", "sqlite:///./clinical.db")
        operations_url = os.getenv("OPERATIONS_DB_URL", "sqlite:///./operations.db")

        # Create the connection engines
        self.engines = {}
        try:
            self.clinical_engine = create_engine(clinical_url)
            self.engines["clinical"] = self.clinical_engine
        except Exception as e:
            print(f"Warning: Could not create clinical engine: {e}")
            self.clinical_engine = None

        try:
            self.operations_engine = create_engine(operations_url)
            self.engines["operations"] = self.operations_engine
        except Exception as e:
            print(f"Warning: Could not create operations engine: {e}")
            self.operations_engine = None

    def get_engine(self, db_name: str):
        """Returns the correct database engine based on the name."""
        if db_name == "operations":
            return self.operations_engine
        return self.clinical_engine

    def execute(self, sql: str, db_name: str = "clinical") -> list:
        """Runs a query and returns list of dicts."""
        engine = self.get_engine(db_name)
        if engine is None:
            return []
        try:
            with engine.connect() as conn:
                result = conn.execute(text(sql))
                columns = list(result.keys())
                rows = result.fetchall()
                return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            print(f"Query execution error: {e}")
            return []

    def get_all_schemas(self) -> dict:
        """Returns schemas from BOTH databases."""
        schemas = {}
        for db_name, engine in self.engines.items():
            if engine is None:
                continue
            try:
                inspector = inspect(engine)
                tables = {}
                for table_name in inspector.get_table_names():
                    columns = []
                    for col in inspector.get_columns(table_name):
                        columns.append({
                            "name": col["name"],
                            "type": str(col["type"]),
                            "primary_key": col.get("primary_key", False) or False
                        })

                    # Get primary key info
                    pk = inspector.get_pk_constraint(table_name)
                    pk_columns = pk.get("constrained_columns", []) if pk else []
                    for c in columns:
                        if c["name"] in pk_columns:
                            c["primary_key"] = True

                    # Get foreign keys
                    fks = inspector.get_foreign_keys(table_name)
                    foreign_keys = []
                    for fk in fks:
                        foreign_keys.append({
                            "columns": fk.get("constrained_columns", []),
                            "referred_table": fk.get("referred_table", ""),
                            "referred_columns": fk.get("referred_columns", [])
                        })

                    tables[table_name] = {
                        "columns": columns,
                        "foreign_keys": foreign_keys
                    }
                schemas[db_name] = tables
            except Exception as e:
                print(f"Error reading schema for {db_name}: {e}")
                schemas[db_name] = {}
        return schemas


# Create a single global instance for the rest of the app to use
db_manager = DBConnectionManager()