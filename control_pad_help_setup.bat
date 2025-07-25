@echo off
cls
echo ===========================================
echo SCRIPT D'INSTALLATION ET DE CONFIGURATION
echo pour PC.remote-control.pad
echo ===========================================
echo.

REM *********************************************************
REM ETAPE 1: VERIFICATION ET INSTALLATION DE NODE.JS
REM *********************************************************
echo.
echo 1. Verification de l'installation de Node.js...
node -v > nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js n'est PAS installe.
    echo VEUILLEZ INSTALLER NODE.JS MANUELLEMENT:
    echo    - Telechargez l'installeur LTS depuis https://nodejs.org/
    echo    - Suivez les instructions d'installation par defaut.
    echo    - Redemarrez ce script APRES l'installation de Node.js.
    echo.
    pause
    exit /b 1
) else (
    echo Node.js est installe. Version:
    node -v
    echo npm est installe. Version:
    npm -v
)
echo.

REM *********************************************************
REM ETAPE 2: INSTALLATION DES DEPENDANCES DU PROJET
REM *********************************************************
echo.
echo 2. Installation des dependances npm du projet... (Cela peut prendre quelques minutes)
npm install
if %errorlevel% neq 0 (
    echo ERREUR: Echec de l'installation des dependances npm.
    echo Verifiez votre connexion internet et les logs d'erreur ci-dessus.
    echo.
    pause
    exit /b 1
) else (
    echo Dependances npm installees avec succes.
)
echo.

REM *********************************************************
REM ETAPE 3: INSTALLATION DES UTILITAIRES GLOBAUX (PM2 et PKG)
REM *********************************************************
echo.
echo 3. Installation des utilitaires globaux (PM2 et PKG)...
echo (PM2 est necessaire pour le redemarrage du serveur via l'UI)
echo (PKG est necessaire si vous voulez creer un .exe standalone)
npm install -g pm2 pkg
if %errorlevel% neq 0 (
    echo ERREUR: Echec de l'installation des utilitaires globaux.
    echo Verifiez les logs d'erreur ci-dessus et vos permissions.
    echo.
    pause
    REM N'exit pas ici, car la NirCmd peut toujours etre utilisee.
) else (
    echo Utilitaires globaux installes avec succes.
)
echo.

REM *********************************************************
REM ETAPE 4: CONFIGURATION DE NIRCMD (Manuel)
REM *********************************************************
echo.
echo 4. CONFIGURATION MANUELLE: NIRCMD
echo    NirCmd est necessaire pour le controle du volume et des medias.
echo    A) TELECHARGEZ NirCmd:
echo       Allez sur https://www.nirsoft.net/utils/nircmd.html
echo       Telechargez la version appropiee (32-bit ou 64-bit) et dezippez-la.
echo    B) PLACEZ nircmd.exe DANS LE PATH DU SYSTEME:
echo       Copiez le fichier "nircmd.exe" dans un dossier qui se trouve dans votre variable d'environnement PATH.
echo       Les dossiers courants sont: C:\Windows\System32 ou C:\Windows
echo       (Si vous ne voulez pas le mettre dans System32, creez un nouveau dossier, ex: C:\Tools\NirCmd,
echo       copiez-y nircmd.exe, puis ajoutez ce dossier a votre PATH via les Variables d'environnement systeme.)
echo    C) TESTEZ NIRCMD:
echo       Ouvrez une NOUVELLE Invite de commandes et tapez "nircmd.exe mutesysvolume 2".
echo       Le son de votre PC devrait couper/retablir.
echo.

REM *********************************************************
REM ETAPE 5: CONFIGURATION OPTIONNELLE: ROBOTJS (Manuel)
REM *********************************************************
echo.
echo 5. CONFIGURATION OPTIONNELLE: ROBOTJS (Pour les raccourcis clavier Fx, Ctrl+C etc.)
echo    Si vous comptez utiliser des raccourcis clavier via l'UI, RobotJS est necessaire.
echo    Il a des pre-requis SYSTEME qui ne peuvent pas etre installes via ce script.
echo    Vous aurez besoin de:
echo    - Python (une version compatible avec Node.js, souvent la 3.x)
echo    - Visual Studio Build Tools (avec le composant "Developpement de bureau en C++")
echo    Consultez la documentation de RobotJS pour plus de details: https://github.com/octalmage/robotjs
echo    Apres avoir installe les pre-requis systeme, vous devrez executer:
echo       npm install --global robotjs (ou l'ajouter aux dependances de votre projet)
echo.

echo ===========================================
echo INSTALLATION TERMINEE (etape manuelle incluses)!
echo Votre environnement de developpement est pret.
echo ===========================================
echo.
echo Pour lancer le serveur en mode DEV (pour developpement):
echo   npm run dev
echo.
echo Pour lancer le serveur en mode PROD (pour utilisation):
echo   npm run build (une seule fois ou apres de gros changements)
echo   pm2 start dist/server/node-build.mjs --name "stream-deck-server"
echo.
pause