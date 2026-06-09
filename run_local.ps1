# run_local.ps1
# OmniDispatch Startup Automation Script for Windows PowerShell

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "                OMNIDISPATCH LOCAL STARTUP" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start the Node.js MCP Server
Write-Host "`n[1/2] Preparing Node.js MCP Server..." -ForegroundColor Yellow
$McpPath = Join-Path $PSScriptRoot "mcp-server"

if (-not (Test-Path (Join-Path $McpPath "node_modules"))) {
    Write-Host "Installing Node.js dependencies (this may take a few seconds)..." -ForegroundColor DarkGray
    Push-Location $McpPath
    try {
        npm install
    } finally {
        Pop-Location
    }
}

Write-Host "Launching MCP server in a separate terminal window..." -ForegroundColor Gray
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$McpPath'; title 'OmniDispatch - Node.js MCP Server'; npm start"

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
Write-Host "  - Node.js MCP Server running at: http://localhost:3000" -ForegroundColor Green
Write-Host "  - Python Agent Service running at: http://localhost:8088" -ForegroundColor Green
Write-Host "  - Map visualizer widget: http://localhost:3000/widgets/map" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
