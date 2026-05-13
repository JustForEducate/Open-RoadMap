@echo off
chcp 65001 > nul
title OpenRoadMap

echo.
echo =========================================
echo    OPENROADMAP - Starting Servers
echo =========================================
echo.

echo [1/2] Starting Backend Server (port 3001)...
start "OpenRoadMap - Backend" cmd /k "cd /d %~dp0backend && node server.js"

timeout /t 2 /nobreak > nul

echo [2/2] Starting Frontend Server (port 5173)...
start "OpenRoadMap - Frontend" cmd /k "cd /d %~dp0frontend && node node_modules\vite\bin\vite.js"

echo.
echo =========================================
echo    Servers are starting...
echo.
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3001
echo.
echo    IMPORTANT: Change default password in AdminAuth.jsx!
echo =========================================
echo.
echo Press any key to open browser...
pause > nul
start http://localhost:5173
