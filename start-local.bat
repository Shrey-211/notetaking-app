@echo off
title NotePulse Local Launcher
echo ===================================================
echo   Starting NotePulse (Backend + Frontend) Locally
echo ===================================================
echo.
echo 1. Ensuring PostgreSQL Database is active...
docker-compose up -d db >nul 2>&1

echo 2. Freeing port 5000 from Docker backend container...
docker-compose stop backend frontend >nul 2>&1

echo 3. Launching Local Backend API & Frontend App...
start "NotePulse Backend API (Port 5000)" cmd /k "cd /d %~dp0backend && npm install && npm run dev"
start "NotePulse Frontend App (Port 3000)" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

echo.
echo Local development servers launched!
echo Open http://localhost:3000 in your browser.
echo.
pause
