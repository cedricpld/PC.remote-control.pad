# Serveur PC - Control Pad

Ce composant est l'agent léger qui s'exécute sur votre PC Windows. Il reçoit les commandes du Client et les exécute localement.

## 🚀 Installation

1.  **Prérequis :** Assurez-vous d'avoir [Python](https://www.python.org/downloads/) (version 3.8 ou supérieure) installé sur votre PC. N'oubliez pas de cocher la case "Add Python to PATH" lors de l'installation.

2.  **Clonez le projet** ou téléchargez les fichiers de ce répertoire sur votre PC.

3.  **Lancez le script d'installation :**
    -   Naviguez dans le dossier `server-pc`.
    -   Exécutez le script `install_windows_service.bat` **en tant qu'administrateur** (clic droit -> Exécuter en tant qu'administrateur).
    -   Le script va :
        1.  Installer les dépendances Python nécessaires.
        2.  Compiler l'application en un fichier `.exe` autonome.
        3.  Vous demander le chemin complet vers cet `.exe` (généralement dans `server-pc\dist\ControlPadServer.exe`).
        4.  Installer et démarrer le service Windows.

Le serveur est maintenant installé et se lancera automatiquement au démarrage de Windows.

## ⚙️ Configuration

Pour configurer le port d'écoute ou le lancement au démarrage, vous pouvez :
1.  Faire un clic droit sur l'icône du Control Pad Server dans la barre des tâches.
2.  Sélectionner "Configuration".
3.  Modifier les paramètres et sauvegarder.

**Note :** Vous devrez redémarrer le service pour que les changements de port prennent effet.

## 🕹️ Utilisation

Une fois le service lancé, une icône apparaîtra dans votre barre des tâches. Vous pouvez faire un clic droit dessus pour accéder aux options :
*   **Statut :** Indique si le serveur est en cours d'exécution.
*   **Configuration :** Ouvre la fenêtre de configuration.
*   **Redémarrer :** Redémarre le service.
*   **Quitter :** Arrête le service.
