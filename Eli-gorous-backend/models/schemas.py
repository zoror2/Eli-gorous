from pydantic import BaseModel
from typing import Optional, Dict, Any

class ChatRequest(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    sql: Optional[str] = None
    chart: Optional[Dict[str, Any]] = None
    flowchart: Optional[str] = None
    data: Optional[Any] = None
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