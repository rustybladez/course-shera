# Backend (FastAPI)

## Run

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

## Seed demo data

```bash
cd backend
.venv\Scripts\activate
python -m scripts.seed_demo
```

Then:
- Ingest the seeded material: `POST /materials/{material_id}/ingest`
- Search: `POST /search`
- Generate: `POST /generate`

