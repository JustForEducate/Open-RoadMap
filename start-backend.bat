@echo off
chcp 65001 > nul
title OpenRoadMap - Backend
cd /d "%~dp0backend"
echo Starting Backend...
node server.js
