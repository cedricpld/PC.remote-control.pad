@echo off
REM Navigue vers le dossier de votre projet.
REM Remplacez "C:\Users\cedri\Documents\GitHub\PC.remote-control.pad" par le chemin réel de votre dossier racine du projet.
cd /d "C:\Users\cedri\Documents\GitHub\PC.remote-control.pad"

REM Lance le serveur en mode développement
start cmd /k npm run dev