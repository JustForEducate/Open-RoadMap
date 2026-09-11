@echo off
chcp 65001 > nul
cd /d "%~dp0"
title OpenRoadMap
call npm run dev
