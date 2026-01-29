# Course Shera - Windows Run Script
# Starts both backend and frontend for development

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Course Shera - Starting Dev Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if setup has been run
if (-not (Test-Path "backend\.venv")) {
    Write-Host "ERROR: Virtual environment not found. Please run setup.ps1 first." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "backend\.env")) {
    Write-Host "ERROR: backend\.env not found. Please configure your environment variables." -ForegroundColor Red
    Write-Host "1. Copy backend\.env.example to backend\.env" -ForegroundColor Yellow
    Write-Host "2. Add your DATABASE_URL and GEMINI_API_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Starting development servers..." -ForegroundColor Green
Write-Host "(Press Ctrl+C to stop all servers)" -ForegroundColor Yellow
Write-Host ""

# Start backend in a new window
Write-Host "📦 Starting FastAPI backend on http://localhost:8000" -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd backend; & '.\.venv\Scripts\Activate.ps1'; uvicorn app.main:app --reload --port 8000"

# Start frontend in a new window
Write-Host "⚛️  Starting Next.js frontend on http://localhost:3000" -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "✓ Servers started in new windows" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
