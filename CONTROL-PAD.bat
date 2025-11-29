@echo off


setlocal enabledelayedexpansion

:: Obtenir l'adresse IP locale commençant par 192.168
for /f "tokens=*" %%a in ('ipconfig ^| findstr /C:"192.168.1"') do (
    for /f "tokens=2 delims=:" %%b in ("%%a") do (
        set ip=%%b
        set ip=!ip:~1!
        echo L'adresse IP locale est: !ip!
        start "" "http://!ip!:3467"
        goto :done
    )
)

:done









:: Ce script utilise la version portable de Node.js pour démarrer le serveur
:: Change le répertoire courant vers le répertoire où se trouve le script
cd /d "%~dp0"

:: Vérifie si node.exe existe dans le répertoire courant
if not exist "node.exe" (
    echo Erreur : node.exe non trouvé dans le répertoire courant.
    pause
    exit /b 1
)

:: Lance le serveur en mode production dans la même fenêtre cmd
.\node.exe .\node_modules\npm\bin\npm-cli.js run start





:: Une fois que le serveur est arrêté, la fenêtre cmd se fermera automatiquement
exit
