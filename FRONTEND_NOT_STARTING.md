# Frontend Not Starting - Quick Fix

## Current Status
❌ Frontend (port 3000): NOT running
✓ Backend (port 8000): Running (or may have connection issues)

## What to Do

### Option 1: Check the Frontend Terminal
Look at the terminal window labeled "frontend" that should have opened. Check for:
- Error messages in red
- Build failures
- Missing dependencies

### Option 2: Rebuild Frontend (Recommended)
```powershell
cd frontend
npm install
npm run dev
```

Wait for message: `"ready - started server on 0.0.0.0:3000"`

Then open http://localhost:3000 in browser.

### Option 3: Start Manually
```powershell
# Terminal 1 - Backend (if not running)
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm install  # Only needed first time
npm run dev
```

---

## Why This Happens

1. **First-time startup**: Next.js compiles on first run (takes 10-20 seconds)
2. **Missing dependencies**: Sometimes npm install is incomplete
3. **Port already in use**: Another process using port 3000
4. **Node modules corrupted**: Rarely, but can happen

---

## Common Error Messages & Fixes

### "Module not found"
```powershell
cd frontend
npm install
```

### "Port 3000 already in use"
```powershell
# Find and kill the process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

### "ENOENT: no such file or directory"
```powershell
# Clean reinstall
cd frontend
rm -r node_modules
rm -r .next
npm install
npm run dev
```

### Build errors
```powershell
cd frontend
npm run build
# If build succeeds, then run dev:
npm run dev
```

---

## Quick Restart Guide

If frontend crashed or stopped:

```powershell
# In the frontend terminal, press Ctrl+C to stop
# Then run:
npm run dev

# Wait for: "ready - started server on 0.0.0.0:3000"
# Then go to http://localhost:3000
```

---

## When It's Working

You'll see message in frontend terminal:
```
▲ Next.js 16.1.6
- Local:        http://localhost:3000
- Environments: .env.local

 ✓ Ready in 1234ms
```

Then http://localhost:3000 will load in your browser.

---

## Still Not Working?

1. Check the frontend terminal for error output
2. Take a screenshot of the error
3. Try: `npm install --save-dev` to update dependencies
4. Delete `.next` folder and rebuild: `npm run dev`
5. Check if port 3000 is really available: `netstat -ano | findstr :3000`

The most common fix is **waiting 10-20 seconds** or **running `npm install` again**.
