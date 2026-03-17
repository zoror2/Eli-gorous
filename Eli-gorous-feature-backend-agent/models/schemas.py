from pydantic import BaseModel
from typing import Optional, Dict, Any, Literal

class ChatRequest(BaseModel):
    message: str
    session_id: str
    mode: Literal["chat", "preview_sql", "run_sql"] = "chat"
    sql_override: Optional[str] = None
    database: Optional[str] = "clinical"

class ChatResponse(BaseModel):
    response: str
    sql: Optional[str] = None
    chart: Optional[Dict[str, Any]] = None
    flowchart: Optional[str] = None
    type: str

class AlertCreate(BaseModel):
    condition_sql: str
    threshold: float
    operator: str
    message: str

class PinChartRequest(BaseModel):
    chart_data: Dict[str, Any]
    title: str
    session_id: str