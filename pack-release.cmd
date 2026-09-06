@echo off
setlocal
cd /d "%~dp0overlay"
call npm install
if errorlevel 1 exit /b 1
call npx electron-builder --win portable
if errorlevel 1 exit /b 1

set OUT=%~dp0release
if exist "%OUT%" rmdir /s /q "%OUT%"
mkdir "%OUT%"
copy /y "dist\WowQuickRef-Overlay.exe" "%OUT%\" >nul
copy /y "%~dp0SETUP.txt" "%OUT%\SETUP.txt" >nul
echo.
echo Packed: release\WowQuickRef-Overlay.exe
echo Push to main to publish it on GitHub Releases automatically.
