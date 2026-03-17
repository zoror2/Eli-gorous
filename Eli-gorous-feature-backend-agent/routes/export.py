"""
Export endpoints — CSV and chart PNG downloads.
"""
import io
import json
import pandas as pd
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/export", tags=["Export"])


@router.post("/csv")
async def export_csv(data: dict, filename: str = "export.csv"):
    """Converts query result data to CSV and returns file download."""
    try:
        df = pd.DataFrame(data.get("rows", []), columns=data.get("columns", []))
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        stream.seek(0)

        return StreamingResponse(
            io.BytesIO(stream.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        return {"error": f"CSV export failed: {str(e)}"}


@router.post("/chart-png")
async def export_chart_png(chart_json: dict, filename: str = "chart.png"):
    """Uses plotly kaleido to render chart as PNG and returns file download."""
    try:
        import plotly.io as pio
        from plotly.io import from_json

        fig = from_json(json.dumps(chart_json))
        img_bytes = pio.to_image(fig, format="png", engine="kaleido")

        return StreamingResponse(
            io.BytesIO(img_bytes),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        return {"error": f"Chart PNG export failed: {str(e)}"}
