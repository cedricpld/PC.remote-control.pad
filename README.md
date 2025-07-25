# 🎮 CONTROL PAD - Votre télécommande de PC personnalisable

**CONTROL PAD** est une application web qui transforme votre téléphone, tablette ou tout autre appareil disposant d'un navigateur en une télécommande puissante et entièrement personnalisable pour votre PC Windows. Lancez des applications, exécutez des raccourcis complexes, contrôlez le volume, surveillez en temps réel les performances de votre système, et bien plus, le tout depuis une interface simple, réactive et élégante.


<img width="775" height="256" alt="image" src="https://github.com/user-attachments/assets/a76cde3b-f191-49e3-9330-41f390e9866e" />



---
## ✨ Fonctionnalités

* **Interface Intuitive :** Une grille inspirée du Stream Deck, facile à utiliser et à organiser.
* **Entièrement Personnalisable :** Créez plusieurs pages et configurez chaque bouton avec des icônes, des couleurs et des actions spécifiques.
* **Monitoring en Temps Réel :** Affichez l'utilisation de votre **CPU**, **RAM**, **GPU** et **VRAM** directement sur votre grille grâce à des blocs de statut dynamiques.
* **Types de Blocs Variés :**
    * **Commande :** Exécutez n'importe quelle commande Windows (`start vlc.exe`) ou outil externe (`nircmd.exe`).
    * **Raccourci :** Simulez des combinaisons de touches complexes (`Ctrl+Shift+S`).
    * **Slider :** Contrôlez des valeurs de manière analogique, comme le volume principal du système.
    * **Statut :** Affichez des informations système en temps réel.
* **Portable :** Créez une version auto-exécutable qui fonctionne sur n'importe quel PC Windows sans installation préalable de Node.js.
* **Open Source :** Basé sur une stack moderne avec React, Vite, Node.js et Express.

---
## 🚀 Installation et Lancement

### Lancement en mode Développement

1.  Clonez le projet sur votre machine.
2.  Ouvrez un terminal à la racine du projet et installez les dépendances :
    
    ```bash
    cd C:\DOSSIER\RACINE\DU\PROJET
    ```
    
    ```bash
    npm install
    ```
3.  Lancez le serveur de développement :
    ```bash
    npm run dev
    ```
    L'application sera accessible sur `http://localhost:3467` et sur votre IP locale.

### Lancement en mode Production

1.  Construisez l'application :
    ```bash
    npm run build
    ```
2.  Lancez le serveur de production :
    ```bash
    npm run start
    ```

### Version Portable

Si le ```npm run build``` a fonctionné, vous pouvez créer la version portable

Vous avez simplement besoin de créer un dossier où vous voulez (Par exemple dans ```C:\Program Files```) et d'y copier les dossier ```dist``` et ```node_modules``` ainsi que les fichiers ```config.json```, ```CONTROL-PAD.bat```, ```node.exe``` et ```package.json```

Enfin normalement vous n'aurez qu'à lancer ```CONTROL-PAD.bat``` et votre server sera fonctionnel

---
## 💡 Aide : Exemples de Commandes

Voici quelques exemples pour vous aider à configurer vos blocs d'action.

### Type : `Commande`

| Action | Commande à insérer |
| :--- | :--- |
| **Couper/Rétablir le son** | `nircmd.exe mutesysvolume 2` |
| **Lancer VLC** | `start "" "C:\Program Files\VideoLAN\VLC\vlc.exe"` *(pensez à vérifier le chemin)* |
| **Lancer le Bloc-notes** | `start notepad.exe` |
| **Ouvrir un site web** | `start https://www.google.com` |

### Type : `Raccourci`

| Action | Raccourci à insérer |
| :--- | :--- |
| **Tout sélectionner** | `Ctrl+A` |
| **Capture d'écran Windows**| `Win+Shift+S` |
| **Fermer la fenêtre active** | `Alt+F4` |

### Type : `Slider`

| Action | Endpoint API à insérer |
| :--- | :--- |
| **Volume Principal du PC**| `/api/set-master-volume` |

### Type : `Afficheur Statut`

| Donnée à afficher | Endpoint API à insérer | Unité |
| :--- | :--- | :--- |
| **Utilisation CPU** | `/api/get-cpu-usage` | `%` |
| **Utilisation RAM** | `/api/get-ram-usage` | `%` |
| **Utilisation GPU/CUDA**| `/api/get-gpu-usage` | `%` |
| **Utilisation VRAM (%)**| `/api/get-vram-usage-percent` | `%` |
| **Utilisation VRAM (Go)**| `/api/get-vram-usage-gb` | `Go` |
