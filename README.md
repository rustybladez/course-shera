# Course Shera (Hackathon MVP)

Monorepo for the **AI-powered supplementary learning platform**.

## Stack (MVP)

- **Frontend**: Next.js (App Router) + Tailwind + shadcn/ui
- **Backend**: FastAPI
- **DB**: Neon Postgres + `pgvector` (remote, free tier)
- **Auth**: Clerk (free tier)
- **AI**: Gemini API (`google-genai`)
- **Vector embeddings**: Gemini embeddings API
- **File storage**: Local filesystem (hackathon-friendly)

## Prerequisites

- **Python 3.10+** (Windows)
- **Node.js 18+** (Windows)
- **Neon Postgres account** (free at https://neon.tech)
- **Gemini API key** (free at https://ai.google.dev)
- **Clerk account** (optional for auth, free tier)

## Quickstart (Windows, no Docker)

### Auto-setup (recommended)

Run the PowerShell setup script:

```powershell
.\setup.ps1
```

This will:
1. Create Python virtual environment
2. Install dependencies
3. Set up environment files
4. Run database migrations

### Manual setup

#### 1) Set up Neon database

1. Go to https://neon.tech and create a free account
2. Create a new project (name: `course-shera`)
3. Get your connection string: `postgresql://user:password@host:5432/course_shera`
4. Keep this handy for step 3 below

#### 2) Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `backend\.env`:
```env
DATABASE_URL=postgresql://user:password@host:5432/course_shera
GEMINI_API_KEY=your-gemini-api-key
```

#### 3) Frontend setup

```bash
cd frontend
copy .env.local.example .env.local
npm install
```

Edit `frontend\.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

### Run locally

**Terminal 1 (Backend):**
```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`.

Or run both with the provided script:

```powershell
.\run.ps1
```

## Database schema

The FastAPI app auto-creates all tables on startup. For manual migrations:

```bash
cd backend
.venv\Scripts\activate
python -m alembic upgrade head  # future use
```

## Demo flow

- Upload a material (Admin upload page) → ingestion runs (chunk + embed)
- Search by natural language → returns grounded excerpts
- Generate notes/code → returns citations + validation report
- Chat → uses the same tools with conversational memory
