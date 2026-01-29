# Course Shera - Windows Run Script
# Starts both backend and frontend for development

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Course Shera - Starting Dev Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if setup has been run
if (-not (Test-Path "backend\venv")) {
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
Write-Host ""

# Start backend in a new window
Write-Host "📦 Starting FastAPI backend on http://localhost:8000" -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-File", ".\start-backend.ps1"

# Wait a bit for backend to start
Start-Sleep -Seconds 2

# Start frontend in a new window  
Write-Host "⚛️  Starting Next.js frontend on http://localhost:3000" -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-File", ".\start-frontend.ps1"

Write-Host ""
Write-Host "✓ Servers starting in new windows..." -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Tip: Use Ctrl+C in each window to stop individual servers" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening frontend in browser in 3 seconds..." -ForegroundColor Green
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"
