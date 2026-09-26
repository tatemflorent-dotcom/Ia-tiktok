@echo off
REM Production automatique (Windows). Lance N videos et garde un journal dans logs\.
REM Usage : double-clic, ou tache planifiee pointant vers ce fichier.
chcp 65001 >nul
set PYTHONUTF8=1
cd /d "%~dp0\.."

set NB_VIDEOS=1
set VOIX=fr-FR-HenriNeural
if exist .env (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
    if not "%%B"=="" set "%%A=%%B"
  )
)

if not exist logs mkdir logs
for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm"') do set STAMP=%%I
echo Production de %NB_VIDEOS% video(s) - journal : logs\%STAMP%.log
python -m pipeline.produce %NB_VIDEOS% --voix %VOIX% > "logs\%STAMP%.log" 2>&1
type "logs\%STAMP%.log"
