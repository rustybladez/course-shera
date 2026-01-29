# Course Shera - Windows Setup Script
# This script automates the setup of the development environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Course Shera - Hackathon MVP Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$python_check = python --version 2>$null
$node_check = node --version 2>$null

if ($null -eq $python_check) {
    Write-Host "ERROR: Python not found. Please install Python 3.10+ from https://www.python.org/" -ForegroundColor Red
    exit 1
}

if ($null -eq $node_check) {
    Write-Host "ERROR: Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Python: $python_check" -ForegroundColor Green
Write-Host "✓ Node.js: $node_check" -ForegroundColor Green
Write-Host ""

# Backend setup
Write-Host "Setting up backend..." -ForegroundColor Yellow
Push-Location backend

# Create virtual environment if it doesn't exist
if (-not (Test-Path ".venv")) {
    Write-Host "  Creating Python virtual environment..."
    python -m venv .venv
}

# Activate virtual environment
Write-Host "  Activating virtual environment..."
& ".\.venv\Scripts\Activate.ps1"

# Install dependencies
Write-Host "  Installing Python dependencies..."
pip install -q -r requirements.txt

# Check if .env exists, if not copy from example
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "  Created .env from .env.example - PLEASE UPDATE IT WITH YOUR CREDENTIALS" -ForegroundColor Magenta
    } else {
        Write-Host "  .env.example not found, creating template..." -ForegroundColor Yellow
    }
}

Pop-Location

Write-Host "✓ Backend setup complete" -ForegroundColor Green
Write-Host ""

# Frontend setup
Write-Host "Setting up frontend..." -ForegroundColor Yellow
Push-Location frontend

# Check if .env.local exists, if not copy from example
if (-not (Test-Path ".env.local")) {
    if (Test-Path ".env.local.example") {
        Copy-Item ".env.local.example" ".env.local"
        Write-Host "  Created .env.local from .env.local.example - PLEASE UPDATE IT WITH YOUR CREDENTIALS" -ForegroundColor Magenta
    } else {
        Write-Host "  .env.local.example not found, creating template..." -ForegroundColor Yellow
    }
}

# Install Node dependencies
Write-Host "  Installing Node.js dependencies (this may take a moment)..."
npm install --q

Pop-Location

Write-Host "✓ Frontend setup complete" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT NEXT STEPS:" -ForegroundColor Magenta
Write-Host "1. Create a Neon Postgres database at https://neon.tech" -ForegroundColor White
Write-Host "2. Update backend\.env with your DATABASE_URL and GEMINI_API_KEY" -ForegroundColor White
Write-Host "3. Update frontend\.env.local with NEXT_PUBLIC_API_URL and Clerk keys (if using auth)" -ForegroundColor White
Write-Host ""
Write-Host "Then run:" -ForegroundColor Green
Write-Host "  .\run.ps1" -ForegroundColor Yellow
Write-Host ""
