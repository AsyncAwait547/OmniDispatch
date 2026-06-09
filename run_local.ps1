# run_local.ps1
# OmniDispatch Startup Automation Script for Windows PowerShell

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "                OMNIDISPATCH LOCAL STARTUP" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start the React Frontend Dev Server
Write-Host "`n[1/2] Preparing React Frontend (Vite)..." -ForegroundColor Yellow
$FrontendPath = Join-Path $PSScriptRoot "Frontend"

if (-not (Test-Path (Join-Path $FrontendPath "node_modules"))) {
    Write-Host "Installing Frontend dependencies (this may take a few seconds)..." -ForegroundColor DarkGray
    Push-Location $FrontendPath
    try {
        npm install --legacy-peer-deps
    } finally {
        Pop-Location
    }
}

Write-Host "Launching React Frontend in a separate terminal window..." -ForegroundColor Gray
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$FrontendPath'; title 'OmniDispatch - React Frontend'; npm run dev"

# 2. Start the Python Agent Service
Write-Host "`n[2/2] Preparing Python Agent Service..." -ForegroundColor Yellow
$AgentPath = Join-Path $PSScriptRoot "agent"

Write-Host "Installing Python dependencies (FastAPI, Uvicorn, etc.)..." -ForegroundColor DarkGray
Push-Location $AgentPath
try {
    pip install -r requirements.txt
} finally {
    Pop-Location
}

Write-Host "Launching Agent Service on Port 8088 in a separate terminal window..." -ForegroundColor Gray
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$AgentPath'; title 'OmniDispatch - Python Agent Service (Port 8088)'; python main.py"

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  Success! Both services are starting in separate windows." -ForegroundColor Green
Write-Host "  - React Frontend running at: http://localhost:8082" -ForegroundColor Green
Write-Host "  - Python Agent Service running at: http://localhost:8088" -ForegroundColor Green
Write-Host "  - Live Control Room: http://localhost:8082/control-room" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
