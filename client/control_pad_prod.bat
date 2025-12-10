@echo off
REM Navigue vers le dossier de votre projet.
cd /d "C:\Users\cedri\Documents\GitHub\PC.remote-control.pad"

REM Lance le serveur en mode production dans la même fenêtre cmd
npm run start

REM Une fois que le serveur est arrêté, la fenêtre cmd se fermera automatiquement
exit
