@echo off
ECHO This script will install the Control Pad PC Server as a Windows Service.
ECHO Please make sure you have Python installed and in your PATH.
PAUSE

REM Step 1: Install Python dependencies
ECHO Installing Python dependencies...
pip install -r requirements.txt
IF %ERRORLEVEL% NEQ 0 (
    ECHO Failed to install dependencies.
    PAUSE
    EXIT /B
)

REM Step 2: Build the executable with PyInstaller
ECHO Building the executable...
pyinstaller --onefile --windowed --add-data "scripts;scripts" main.py --name ControlPadServer
IF %ERRORLEVEL% NEQ 0 (
    ECHO Failed to build the executable.
    PAUSE
    EXIT /B
)

REM Step 3: Install the service
ECHO Installing the Windows Service...
ECHO IMPORTANT: You will need to provide the full path to the executable.
SET /p EXE_PATH="Enter the full path to ControlPadServer.exe (e.g., C:\path\to\server-pc\dist\ControlPadServer.exe): "

sc create ControlPadServer binPath= "%EXE_PATH%" start= auto
sc description ControlPadServer "Control Pad server for PC remote control."
sc start ControlPadServer
IF %ERRORLEVEL% NEQ 0 (
    ECHO Failed to install the service. You may need to run this script as an administrator.
    PAUSE
    EXIT /B
)

ECHO Service installed and started successfully.
PAUSE
