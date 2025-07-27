@echo off
REM Navigue vers le dossier de votre projet.
cd /d "C:\Users\cedri\Documents\GitHub\PC.remote-control.pad"

REM Lance le serveur en mode développement dans la même fenêtre cmd
npm run dev

REM Une fois que le serveur est arrêté, la fenêtre cmd se fermera automatiquement
exit
