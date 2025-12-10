# **CONTROL PAD** - Votre télécommande de PC personnalisable

**CONTROL PAD** est une application web qui transforme votre téléphone, tablette ou tout autre appareil en une télécommande puissante pour votre environnement numérique. Grâce à son architecture client-serveur, vous pouvez contrôler votre PC Windows à distance et gérer des appareils connectés sur votre réseau local (comme les ampoules Yeelight) 24h/24 et 7j/7.

<img width="775" height="256" alt="image" src="https://github.com/user-attachments/assets/a76cde3b-f191-49e3-9330-41f390e9866e" />

---
##  архитектура

Le projet est maintenant divisé en deux parties distinctes :

### 1. Le Client (Raspberry Pi / Serveur Domestique)
- **Rôle :** C'est le cœur de l'application. Il héberge l'interface web, gère la configuration et exécute les commandes qui ne dépendent pas de votre PC (contrôle des Yeelights, Wake on LAN, etc.). Il peut tourner 24h/24 sur un appareil à faible consommation comme un Raspberry Pi.
- **Pour plus de détails :** [Voir le README du Client](./client/README.md)

### 2. Le Serveur PC (Windows)
- **Rôle :** C'est un agent léger qui s'exécute sur votre PC Windows. Il écoute les instructions envoyées par le Client et exécute les actions spécifiques au PC (lancer des applications, simuler des raccourcis, contrôler le volume, etc.).
- **Pour plus de détails :** [Voir le README du Serveur PC](./server/README.md)

---
## ✨ Fonctionnalités Principales

* **Architecture Distribuée :** Accédez à votre interface de contrôle même lorsque votre PC principal est éteint.
* **Indicateur de Connexion :** Sachez en temps réel si votre PC est en ligne et prêt à recevoir des commandes.
* **Exécution Ciblée :** Choisissez pour chaque bouton s'il doit s'exécuter sur le Client (ex: allumer une lumière) ou sur le Serveur PC (ex: lancer un jeu).
* **Nouveau Bloc "Wake on LAN" :** Réveillez vos appareils en réseau (y compris votre PC) directement depuis l'interface.
* **Services Windows et Linux :** Lancez les deux applications automatiquement au démarrage de vos machines pour une disponibilité maximale.
* **Mode Plein Écran :** Idéal pour une utilisation sur tablette.
* **Toutes les fonctionnalités existantes** (monitoring, sliders, personnalisation) sont conservées !

---
## 🚀 Installation Rapide

1.  **Installez le Client** sur votre Raspberry Pi (ou autre serveur Linux). Suivez les instructions [ici](./client/README.md).
2.  **Installez le Serveur PC** sur votre machine Windows. Suivez les instructions [ici](./server/README.md).
3.  **Configurez l'adresse** du Serveur PC dans les paramètres de l'interface web du Client.

Et voilà ! Votre système de contrôle est prêt.
