@echo off
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
