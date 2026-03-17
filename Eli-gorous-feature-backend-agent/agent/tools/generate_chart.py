import json
import pandas as pd
import plotly.express as px
import plotly.io as pio
from langchain.tools import tool
from database.connection import db_manager

@tool
def generate_chart(
    sql: str, 
    chart_type: str,
    x_column: str,
    y_column: str,
    title: str
) -> dict:
    """
    Generates an interactive chart from a SQL query.
    
    Args:
        sql: Valid SQL query string to fetch data for the chart
        chart_type: "bar", "line", "pie", "scatter"
        x_column: Column name for X axis
        y_column: Column name for Y axis  
        title: Chart title
    
    Returns:
        Dict with chart_json, chart_type, title, and insight
    """
    try:
        # 1. Fetch data directly using the SQL query to avoid passing massive dicts through the LLM
        engine = db_manager.get_engine("clinical")
        df = pd.read_sql(sql, engine)
        
        if df.empty:
            return {"error": "No data available to generate a chart."}

        # 2. Build the chart using Plotly Express with the requested dark theme
        if chart_type == "bar":
            fig = px.bar(df, x=x_column, y=y_column, title=title, template="plotly_dark")
        elif chart_type == "line":
            fig = px.line(df, x=x_column, y=y_column, title=title, template="plotly_dark")
        elif chart_type == "scatter":
            fig = px.scatter(df, x=x_column, y=y_column, title=title, template="plotly_dark")
        elif chart_type == "pie":
            # Pie charts use 'names' and 'values' instead of x and y axes
            fig = px.pie(df, names=x_column, values=y_column, title=title, template="plotly_dark")
        else:
            return {"error": f"Unsupported chart type: {chart_type}. Use bar, line, pie, or scatter."}

        # 3. Convert the Plotly figure to a JSON string
        chart_json_str = pio.to_json(fig)
        chart_json = json.loads(chart_json_str)

        # 4. Generate a very basic statistical insight 
        if pd.api.types.is_numeric_dtype(df[y_column]):
            max_row = df.loc[df[y_column].idxmax()]
            insight = f"The highest value for {y_column} is {max_row[y_column]} associated with {max_row[x_column]}."
        else:
            insight = "Chart generated successfully. Ready for further visual analysis."

        # 5. Return the strict format requested by the backend instructions
        return {
            "chart_json": chart_json,
            "chart_type": chart_type,
            "title": title,
            "insight": insight
        }

    except Exception as e:
        return {"error": f"Failed to generate chart: {str(e)}"}