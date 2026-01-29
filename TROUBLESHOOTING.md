# Setup & Run Troubleshooting Guide

## Quick Solutions

### Problem: "Virtual environment not found"
**Solution:**
```powershell
.\setup.ps1
```
This creates the `venv` directory in the backend folder.

### Problem: ".env file not found"
**Solution:**
1. Go to `backend` folder
2. Copy `.env.example` to `.env`
3. Edit `.env` and add your Neon and Gemini credentials

### Problem: "npm: command not found"
**Solution:**
1. Install Node.js from https://nodejs.org
2. Restart PowerShell
3. Run `node --version` to verify

### Problem: "python: command not found"
**Solution:**
1. Install Python from https://www.python.org
2. Restart PowerShell  
3. Run `python --version` to verify

---

## Step-by-Step Setup

### Step 1: Prerequisites
Make sure you have:
- [ ] Python 3.10+ (run `python --version`)
- [ ] Node.js 18+ (run `node --version`)
- [ ] Git (run `git --version`)

### Step 2: Create Free Accounts
- [ ] Neon Postgres: https://neon.tech
- [ ] Gemini API: https://ai.google.dev

### Step 3: Run Setup
```powershell
# From project root directory
.\setup.ps1
```

### Step 4: Configure Environment

**For backend:**
1. Go to `backend` folder
2. Open `.env` file
3. Update these fields:
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
GEMINI_API_KEY=your-api-key-here
```

**For frontend:**
1. Go to `frontend` folder
2. Open `.env.local` file
3. Make sure it has:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 5: Run Servers
```powershell
.\run.ps1
```

This will:
- Open a new window for the backend (FastAPI on :8000)
- Open a new window for the frontend (Next.js on :3000)
- Open your browser to http://localhost:3000

---

## Troubleshooting Common Errors

### Error: "psycopg connection failed"
**Cause:** DATABASE_URL is wrong or database is unreachable

**Fix:**
1. Copy your connection string from Neon dashboard
2. Make sure it's in `backend/.env`
3. Test: Open Neon dashboard and verify connection details

### Error: "ModuleNotFoundError: No module named 'app'"
**Cause:** Virtual environment is not activated or dependencies not installed

**Fix:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Error: "GEMINI_API_KEY not found"
**Cause:** Key is not in .env file or file doesn't exist

**Fix:**
1. Go to https://ai.google.dev
2. Get your API key
3. Add to `backend/.env`:
```env
GEMINI_API_KEY=your-key-here
```

### Error: "Port 8000 already in use"
**Cause:** Another process is using the port

**Fix:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with the process id)
taskkill /PID <PID> /F

# Or use a different port
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8001
```

### Error: "Port 3000 already in use"
**Cause:** Another process is using the port

**Fix:**
```powershell
cd frontend
npm run dev -- -p 3001
```

---

## Manual Start (if scripts fail)

### Start Backend Manually
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

### Start Frontend Manually
```powershell
cd frontend
npm run dev
```

---

## Verify Everything Works

### Check Backend
1. Open browser to http://localhost:8000/docs
2. You should see Swagger API documentation
3. Try calling `/health` endpoint (if it exists)

### Check Frontend
1. Open browser to http://localhost:3000
2. You should see the Next.js application
3. Check browser console for errors (F12)

### Check Database Connection
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -c "from app.db import engine; print(engine.connect()); print('✓ Database connected')"
```

---

## Getting More Help

1. **Read the full docs:**
   - See `00_READ_ME_FIRST.md`
   - See `SETUP_GUIDE.md`

2. **Check the logs:**
   - Both backend and frontend output logs
   - Error messages are usually clear

3. **Reset everything:**
   - Delete `backend/venv` folder
   - Delete `frontend/node_modules` folder
   - Delete `frontend/.next` folder
   - Run `.\setup.ps1` again

---

## Quick Checklist

- [ ] Python installed (`python --version`)
- [ ] Node.js installed (`node --version`)
- [ ] Neon account created
- [ ] Gemini API key obtained
- [ ] `.\setup.ps1` ran successfully
- [ ] `backend/.env` configured
- [ ] `frontend/.env.local` has API_URL
- [ ] `.\run.ps1` starts both servers
- [ ] http://localhost:3000 loads in browser
- [ ] http://localhost:8000/docs shows API docs
- [ ] Ready to code! ✓

---

## Still Stuck?

1. Check if you followed all steps in "Step-by-Step Setup" above
2. Make sure .env files are configured (not just created)
3. Verify database connection string is correct
4. Check that API key is not expired or invalid
5. Try the "Manual Start" section if scripts fail
6. Check file paths use backslashes: `.\venv\` not `./venv`

Good luck! 🚀
