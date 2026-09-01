@echo off
setlocal
cd /d "%~dp0"
if not exist dist\index.html (
  echo dist\index.html was not found. Run build-standalone.bat first.
  pause
  exit /b 1
)
where py >nul 2>&1
if %errorlevel%==0 (
  start "" http://localhost:8000/
  py -3 -m http.server 8000 --directory dist
  exit /b %errorlevel%
)
where python >nul 2>&1
if %errorlevel%==0 (
  start "" http://localhost:8000/
  python -m http.server 8000 --directory dist
  exit /b %errorlevel%
)
echo Python was not found. Open the GitHub Pages version or serve dist over localhost with another static web server.
pause
exit /b 1
