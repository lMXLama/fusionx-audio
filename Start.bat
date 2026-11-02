@echo off
title Fusion-X Audio
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js fehlt. Bitte von https://nodejs.org installieren und dann erneut starten.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Erster Start: Abhaengigkeiten werden installiert ...
  call npm install
)
call npm start
