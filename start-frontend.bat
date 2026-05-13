@echo off
chcp 65001 > nul
title OpenRoadMap - Frontend
cd /d "%~dp0frontend"
echo Starting Frontend...
node node_modules\vite\bin\vite.js
