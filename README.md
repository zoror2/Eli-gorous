# DataGod Health

AI-powered hospital intelligence platform for querying, visualizing, monitoring, and sharing healthcare insights in real time.

## Why This Project Exists
Hospitals run on critical data, but most teams still depend on delayed reports, SQL specialists, and fragmented tools.

DataGod Health turns operations into a conversation:
- Ask in natural language
- Review generated SQL before execution
- Visualize instantly
- Pin insights to a command dashboard
- Share with teammates
- Trigger alerts proactively

## What We Built
### Core platform
- Natural Language to SQL with SQL preview
- FastAPI backend with Python-based agent workflows
- React + Vite chat and dashboard interface
- Local-model path via Ollama for privacy-sensitive hospital data
- Gemini + fallback strategy for resilience

### Clinical operations workflow features
- Multi-database querying (clinical + operations)
- Interactive chart generation
- Pin to dashboard
- Shareable links for pinned visualizations
- Query history and favorites with rerun
- Voice input support
- Alerts feed and scheduled alert checks
- Export endpoints for downstream reporting

## Architecture
### Frontend (App)
- Path: data-oracle-main
- Stack: React, Vite, TypeScript, React Query, Plotly
- Purpose: chat, dashboard, alerts, history, pin/share flow

### Frontend (Landing)
- Path: datagod-health-hub-main/datagod-health-hub-main
- Stack: React, Vite, TypeScript
- Purpose: product narrative, feature showcase, launch into main app

### Backend API
- Path: Eli-gorous-feature-backend-agent
- Stack: FastAPI, Python, SQLAlchemy, LangGraph, LangChain
- Purpose: agent execution, DB access, alerts, exports, sharing APIs

### Databases
- Clinical DB (SQLite): patient/encounter/condition/observation style data
- Operations DB (SQLite): chat history, favorites, pinned charts, shares, alerts

## Fixed Local Endpoints
Use these exact endpoints while running locally:
- Chat app: http://localhost:5173/
- Landing page: http://localhost:5174/
- Backend API: http://localhost:8000/
- Swagger docs: http://localhost:8000/docs

## How It Works (Runtime Flow)
1. User asks a question in plain language.
2. Agent resolves schema context and generates SQL.
3. SQL can be previewed before execution.
4. Query runs on selected DB (clinical or operations).
5. Results are transformed into chart + explanation.
6. User can pin chart to dashboard.
7. Pinned chart can be shared via tokenized link.
8. Alerts monitor configured rules in background.

## Local Setup (Windows / PowerShell)
### Prerequisites
- Node.js 18+
- Python 3.10+
- pip
- (Optional but recommended) Ollama running locally

### 1) Backend setup
```powershell
cd D:\Eli-goros\Eli-gorous-feature-backend-agent
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Main app setup (chat/dashboard)
```powershell
cd D:\Eli-goros\data-oracle-main
npm install
npm run dev
```

### 3) Landing app setup
```powershell
cd D:\Eli-goros\datagod-health-hub-main\datagod-health-hub-main
npm install
npm run dev
```

### Recommended startup order
1. Start backend first (8000)
2. Start main app second (5173)
3. Start landing app third (5174)

## Environment Variables
Backend reads environment from Eli-gorous-feature-backend-agent/.env.

Key variables:
- LLM_PROVIDER=auto | gemini | ollama
- GEMINI_API_KEY=<key>
- GEMINI_MODEL=gemini-1.5-flash
- GEMINI_FALLBACK_MODEL=<optional>
- OLLAMA_BASE_URL=http://localhost:11434
- OLLAMA_MODEL=llama3.1:8b
- CLINICAL_DB_URL=sqlite:///./clinical.db
- OPERATIONS_DB_URL=sqlite:///./operations.db

Optional notifier variables:
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM_NUMBER
- SMTP_EMAIL
- SMTP_PASSWORD

## API Surface (High-level)
- /chat: run conversational analytics
- /history and /history/{session_id}: retrieve prior messages
- /dashboard/overview: command center KPIs
- /dashboard/pin and /dashboard: manage pinned visuals
- /dashboard/{id}/share and /dashboard/share/{token}: collaboration links
- /alerts: alert feed + rules
- /export: export data assets

## Demo Runbook (Judge-ready)
1. Open landing page (5174) and click Launch App.
2. Ask a plain-English analytics question.
3. Show generated SQL preview.
4. Execute and visualize the result.
5. Pin chart to dashboard.
6. Open dashboard and verify pinned chart appears.
7. Generate share link and open the shared chart route.
8. Open Alerts and explain active monitoring.

## Requirements Audit Status
Backend requirements in Eli-gorous-feature-backend-agent/requirements.txt are valid for the current codebase and include the required APScheduler dependency used by automation/scheduler.py.

Notes:
- If you saw ModuleNotFoundError: apscheduler, install dependencies inside the active virtual environment:
  - pip install -r requirements.txt

## Troubleshooting
### Port already in use
- Stop the old process using that port, then restart dev servers.
- Main app is fixed to 5173 and landing app to 5174.

### /chat shows 404
- Ensure you are on the main app endpoint (5173), not the landing page (5174).

### Browserslist warning
- Non-blocking warning only.
- Optional update command:
  - npx update-browserslist-db@latest

## Team
- Prajwal H M (CSE, 3rd Year)
- Rajasekar V (CSE, 2nd Year)
- Sonu J (CSE, 2nd Year)
- Rukmini V M (CSE, 2nd Year)
- Sevanth N (CSE, 2nd Year)
