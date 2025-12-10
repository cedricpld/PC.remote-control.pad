# Serveur PC - Control Pad

Ce composant est l'agent qui s'exécute sur votre PC Windows. Il reçoit les commandes du Client (Raspberry Pi) et les exécute.

## 🚀 Installation & Démarrage

1.  **Prérequis :** [Python](https://www.python.org/downloads/) (version 3.8+). Cochez "Add Python to PATH" lors de l'installation.

2.  **Installation des dépendances :**
    Double-cliquez sur `install_requirements.bat` (ou lancez `pip install -r requirements.txt`).

3.  **Lancement :**
    Lancez `start.bat` ou exécutez `python main.py`.
    Une icône apparaîtra dans la barre des tâches (près de l'horloge).

4.  **Démarrage Automatique :**
    Pour que le serveur se lance automatiquement avec Windows :
    - Clic-droit sur l'icône dans la barre des tâches.
    - Choisissez **Configuration**.
    - Cochez **Start on Windows boot** et sauvegardez.

## ⚙️ Configuration

- **Port :** Par défaut 8765. Si vous le changez, n'oubliez pas de mettre à jour la configuration sur l'interface web du Client.
