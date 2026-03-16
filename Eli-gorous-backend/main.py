from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.clinical_db import seed_clinical_db
from database.operations_db import setup_operations_db
from automation.scheduler import start_scheduler, stop_scheduler
from routes import chat, history, dashboard, export, alerts


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    setup_operations_db()
    seed_clinical_db()
    start_scheduler()
    print("DataGod Health backend is ready!")
    yield
    # Shutdown
    stop_scheduler()


app = FastAPI(title="DataGod Health API", lifespan=lifespan)

# CORS setup — allows frontend (port 5173) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Plug in all routers
app.include_router(chat.router)
app.include_router(history.router)
app.include_router(dashboard.router)
app.include_router(export.router)
app.include_router(alerts.router)


@app.get("/")
async def root():
    return {"status": "DataGod Health is running"}