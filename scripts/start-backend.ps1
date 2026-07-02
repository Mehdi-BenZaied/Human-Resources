$ErrorActionPreference = "Stop"

$env:PATH = "C:\Program Files\nodejs\;" + $env:PATH

Set-Location "C:\Users\mehdi\OneDrive\Desktop\DevopsMastering\backend"

Write-Host "Running Prisma migrations..." -ForegroundColor Cyan
npx prisma migrate dev --name init

Write-Host ""
Write-Host "Seeding database..." -ForegroundColor Cyan
npm run seed

Write-Host ""
Write-Host "Starting backend dev server..." -ForegroundColor Green
npm run dev
