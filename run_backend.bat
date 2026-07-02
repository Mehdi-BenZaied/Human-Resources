@echo off
set PYTHON=C:\Users\mehdi\AppData\Local\Programs\Python\Python312\python.exe
set PIP=C:\Users\mehdi\AppData\Local\Programs\Python\Python312\Scripts\pip.exe
set ALEMBIC=C:\Users\mehdi\AppData\Local\Programs\Python\Python312\Scripts\alembic.exe
set UVICORN=C:\Users\mehdi\AppData\Local\Programs\Python\Python312\Scripts\uvicorn.exe

cd /d "c:\Users\mehdi\OneDrive\Desktop\DevopsMastering\backend"

echo.
echo [1/4] Installing dependencies...
%PIP% install -r requirements.txt
if errorlevel 1 (echo ERROR: pip install failed && pause && exit /b 1)

echo.
echo [2/4] Running Alembic migrations...
%ALEMBIC% upgrade head
if errorlevel 1 (echo ERROR: migrations failed && pause && exit /b 1)

echo.
echo [3/4] Seeding database...
%PYTHON% seed.py

echo.
echo [4/4] Starting FastAPI server on port 4000...
echo       API docs: http://localhost:4000/api/docs
echo       Health:   http://localhost:4000/api/health
echo.
%UVICORN% main:app --reload --host 0.0.0.0 --port 4000
