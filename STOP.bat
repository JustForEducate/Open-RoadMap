@echo off
chcp 65001 > nul
title OpenRoadMap - Stop

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo =========================================
    echo    OPENROADMAP - Stopping Servers
    echo =========================================
    echo.
    echo [WARN] Administrator rights required!
    echo.
    echo Restarting with administrator rights...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /B
)

echo.
echo =========================================
echo    OPENROADMAP - Stopping Servers
echo =========================================
echo.

echo Stopping servers...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo [OK] All Node.js processes stopped
echo.
echo =========================================
echo    Servers stopped!
echo =========================================
echo.
echo Press any key to exit...
pause > nul
