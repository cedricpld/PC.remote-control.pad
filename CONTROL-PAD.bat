@echo off
:: Ce script utilise la version portable de Node.js pour démarrer le serveur

:: Vérifie si node.exe existe dans le répertoire courant
if not exist "node.exe" (
    echo Erreur : node.exe non trouvé dans le répertoire courant.
    pause
    exit /b 1
)

:: Exécute la commande "npm run start" en utilisant le node.exe local
.\node.exe .\node_modules\npm\bin\npm-cli.js run start

:: Garde la fenêtre ouverte jusqu'à ce qu'une touche soit pressée
pause
