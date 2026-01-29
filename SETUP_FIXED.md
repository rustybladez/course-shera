# ✅ Fixed - Ready to Run!

## What Was Wrong

The original `run.ps1` script had issues with:
1. PowerShell string escaping in `-Command` parameter
2. Improper path handling
3. Complex multi-line command strings

## What's Fixed

✅ **Improved Scripts:**
- `run.ps1` - Now uses `-File` parameter for sub-scripts (more reliable)
- `setup.ps1` - Cleaned up and simplified
- **NEW:** `start-backend.ps1` - Simple backend launcher
- **NEW:** `start-frontend.ps1` - Simple frontend launcher

✅ **Added Troubleshooting:**
- `TROUBLESHOOTING.md` - Comprehensive error solutions

## How to Run Now

### Quick Start (One Command)
```powershell
.\run.ps1
```

This will:
1. Check prerequisites
2. Start backend in new window (http://localhost:8000)
3. Start frontend in new window (http://localhost:3000)
4. Open browser to http://localhost:3000

### Alternative: Start Manually (if needed)

**Terminal 1 - Backend:**
```powershell
.\start-backend.ps1
```

**Terminal 2 - Frontend:**
```powershell
.\start-frontend.ps1
```

---

## Current Status

✅ Virtual environment created (`backend\venv`)
✅ Dependencies installed
✅ `.env` files created (from examples)
✅ Scripts fixed and tested
✅ Ready for development

---

## What You Need to Do

### If You Haven't Already:

1. **Create Neon Account**
   - Go to https://neon.tech
   - Create project "course-shera"
   - Copy connection string

2. **Create Gemini API Key**
   - Go to https://ai.google.dev
   - Get your API key

3. **Configure `.env` Files**
   - Edit `backend/.env`:
     ```env
     DATABASE_URL=postgresql://user:password@host/course_shera
     GEMINI_API_KEY=your-api-key-here
     ```
   - Edit `frontend/.env.local`:
     ```env
     NEXT_PUBLIC_API_URL=http://localhost:8000
     ```

4. **Run the Project**
   ```powershell
   .\run.ps1
   ```

---

## File Structure

```
course-shera/
├── setup.ps1           ← Run once to set up (already done)
├── run.ps1             ← Run daily to start servers (FIXED)
├── start-backend.ps1   ← NEW: Start just backend
├── start-frontend.ps1  ← NEW: Start just frontend
├── TROUBLESHOOTING.md  ← NEW: Error solutions
│
├── backend/
│   ├── venv/           ✓ Virtual environment (created)
│   ├── .env            ✓ Configuration (needs credentials)
│   └── app/
│
└── frontend/
    ├── node_modules/   ✓ Dependencies (installed)
    ├── .env.local      ✓ Configuration
    └── src/
```

---

## Testing the Setup

### Test 1: Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -c "from app.db import engine; print('✓ Database module loaded')"
```

### Test 2: Frontend
```powershell
cd frontend
npm --version
```

### Test 3: Full Start
```powershell
.\run.ps1
# Wait for both to start
# Check:
# - http://localhost:3000 (should load)
# - http://localhost:8000/docs (should show API docs)
```

---

## Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| "Virtual environment not found" | Run `.\setup.ps1` again |
| ".env file missing" | Create from `.env.example` and add credentials |
| "Port 8000 already in use" | Use `--port 8001` in backend start script |
| "npm command not found" | Install Node.js from nodejs.org |
| "python command not found" | Install Python from python.org |

For more help, see `TROUBLESHOOTING.md`.

---

## What's Next

1. **Make sure .env files have credentials** (Neon URL + Gemini key)
2. **Run:** `.\run.ps1`
3. **Check:** Both servers start in new windows
4. **Open:** http://localhost:3000 in browser
5. **Start coding!** Follow `DEVELOPMENT_CHECKLIST.md`

---

## Quick Reference

| Command | What It Does |
|---------|--------------|
| `.\setup.ps1` | Create venv + install dependencies (one-time) |
| `.\run.ps1` | Start both servers (daily) |
| `.\start-backend.ps1` | Start just FastAPI (no venv activation needed) |
| `.\start-frontend.ps1` | Start just Next.js |

---

## You're Ready! 🚀

Everything is set up and fixed. Just:
1. Add credentials to `.env` files
2. Run `.\run.ps1`
3. Start building!

The scripts will now work smoothly on Windows without Docker.

---

**Status: ✅ READY FOR DEVELOPMENT**

Next: `.\run.ps1` → Start coding → Demo day! 🎉
