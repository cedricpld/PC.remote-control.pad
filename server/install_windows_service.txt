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
