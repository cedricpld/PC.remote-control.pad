@echo off
cls
echo ===========================================
echo SETUP SCRIPT FOR CONTROL PAD CLIENT (DEV)
echo ===========================================
echo.

REM *********************************************************
REM STEP 1: CHECK NODE.JS
REM *********************************************************
echo.
echo 1. Checking Node.js installation...
node -v > nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is NOT installed.
    echo Please install Node.js LTS from https://nodejs.org/
    echo then restart this script.
    echo.
    pause
    exit /b 1
) else (
    echo Node.js installed:
    node -v
    echo npm installed:
    npm -v
)
echo.

REM *********************************************************
REM STEP 2: INSTALL DEPENDENCIES
REM *********************************************************
echo.
echo 2. Installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies.
    echo.
    pause
    exit /b 1
)
echo Dependencies installed.
echo.

echo ===========================================
echo SETUP COMPLETE!
echo ===========================================
echo.
echo To run the Client in DEV mode:
echo   npm run dev
echo.
echo Note: This only sets up the CLIENT side.
echo You must also set up the Python Server on your PC.
echo See server/README.md for instructions.
echo.
pause
