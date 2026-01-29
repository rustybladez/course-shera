#!/usr/bin/env pwsh
# Diagnostic script to check if servers are running

Write-Host "Checking if servers are running..." -ForegroundColor Cyan
Write-Host ""

# Check backend (port 8000)
Write-Host "Backend (port 8000):" -ForegroundColor Yellow
try {
    $result = Test-NetConnection -ComputerName localhost -Port 8000 -WarningAction SilentlyContinue
    if ($result.TcpTestSucceeded) {
        Write-Host "  ✓ Backend is running" -ForegroundColor Green
        Write-Host "    Visit: http://localhost:8000/docs" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Backend is NOT responding on port 8000" -ForegroundColor Red
    }
}
catch {
    Write-Host "  ✗ Backend is NOT running" -ForegroundColor Red
}

Write-Host ""

# Check frontend (port 3000)
Write-Host "Frontend (port 3000):" -ForegroundColor Yellow
try {
    $result = Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue
    if ($result.TcpTestSucceeded) {
        Write-Host "  ✓ Frontend is running" -ForegroundColor Green
        Write-Host "    Visit: http://localhost:3000" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Frontend is NOT responding on port 3000" -ForegroundColor Red
        Write-Host "    Common fixes:" -ForegroundColor Yellow
        Write-Host "      1. Wait 10-20 seconds for Next.js to compile first time" -ForegroundColor Gray
        Write-Host "      2. Check the frontend terminal for error messages" -ForegroundColor Gray
        Write-Host "      3. Make sure node_modules is installed (npm install)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "  ✗ Frontend is NOT running" -ForegroundColor Red
}

Write-Host ""
Write-Host "Tips:" -ForegroundColor Cyan
Write-Host "  • First-time Next.js startup takes 10-20 seconds" -ForegroundColor Gray
Write-Host "  • Check the terminal windows for error messages" -ForegroundColor Gray
Write-Host "  • If backend shows errors, check backend/.env configuration" -ForegroundColor Gray
Write-Host "  • If frontend shows errors, try: npm install" -ForegroundColor Gray
