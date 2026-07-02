$ErrorActionPreference = "Stop"

$env:PATH = "C:\Program Files\nodejs\;" + $env:PATH

Set-Location "C:\Users\mehdi\OneDrive\Desktop\DevopsMastering\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    npm install
}

Write-Host "Starting Angular dev server on http://localhost:4200 ..." -ForegroundColor Green
npm start
