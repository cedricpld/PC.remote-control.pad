import express_namespace from "express"; // Importez Express de manière robuste
const express = express_namespace.default || express_namespace; // Prenez l'export par défaut ou le namespace complet
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";

// Importations et définitions pour __dirname en ES Modules
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// NOUVEAU: Import pour robotjs
// Attention: Assurez-vous que robotjs est bien installé (npm install robotjs)
// et que ses prérequis système sont en place (Python, Visual Studio Build Tools sous Windows).
import robot from 'robotjs';

// Chemin de configuration: utilise process.cwd() pour la compatibilité avec le .exe packagé.
// En mode dev, process.cwd() est la racine du projet.
// En mode prod avec le .exe, process.cwd() est le dossier d'où est lancé le .exe.
// Cela permet à config.json d'être modifiable et persistant en dehors du .exe.
const CONFIG_FILE = path.join(process.cwd(), 'config.json');

// Fonction pour lire la configuration depuis config.json
async function readConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`Fichier de configuration non trouvé à ${CONFIG_FILE}, création d'une configuration par défaut.`);
      return []; // Retourne un tableau vide si le fichier n'existe pas
    }
    console.error("Erreur lors de la lecture du fichier de configuration :", error);
    throw error;
  }
}

// Fonction pour écrire la configuration dans config.json
async function writeConfig(config: any) {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`Configuration sauvegardée avec succès à ${CONFIG_FILE}.`);
  } catch (error) {
    console.error("Erreur lors de l'écriture du fichier de configuration :", error);
    throw error;
  }
}

// Fonction d'aide pour parser les raccourcis clavier pour robotjs
// Supporte les modificateurs courants (Ctrl, Alt, Shift, Win) et une seule touche.
function parseShortcut(shortcut: string): { key: string, modifiers: string[] } | null {
    const parts = shortcut.split('+').map(p => p.trim());
    let rawKey = parts[parts.length - 1]; // Ex: 'S', 'F5', 'space'

    const modifiers: string[] = [];
    for (let i = 0; i < parts.length - 1; i++) {
        const mod = parts[i].toLowerCase();
        if (mod === 'ctrl') modifiers.push('control');
        else if (mod === 'alt') modifiers.push('alt');
        else if (mod === 'shift') modifiers.push('shift');
        else if (mod === 'win' || mod === 'windows') modifiers.push('meta'); // 'meta' pour la touche Windows dans robotjs
    }

    let key: string;
    // Gérer les touches spéciales (robotjs attend des chaînes spécifiques en minuscules)
    const specialKeys = [
        'backspace', 'delete', 'enter', 'escape', 'space', 'tab',
        'up', 'down', 'left', 'right', 'home', 'end', 'pageup', 'pagedown',
        'capslock', 'numlock', 'scrolllock', 'printscreen', 'pause', 'insert',
        'menu', // Touche de menu contextuel
        'leftmouse', 'rightmouse', 'middlemouse', 'doubleclick', 'rightclick', 'leftclick' // Clics de souris si utilisés comme "touches"
    ];

    if (specialKeys.includes(rawKey.toLowerCase())) {
        key = rawKey.toLowerCase(); // Convertir en minuscule si c'est une touche spéciale
    }
    // Gérer les touches de fonction (F1-F24)
    else if (rawKey.toLowerCase().startsWith('f') && rawKey.length > 1 && !isNaN(parseInt(rawKey.substring(1)))) {
        key = rawKey.toUpperCase(); // robotjs attend 'F1', 'F2', etc. en majuscules
    }
    // Gérer les touches de caractères uniques (lettres, chiffres, symboles). robotjs attend généralement les minuscules pour les lettres.
    else if (rawKey.length === 1) {
        key = rawKey.toLowerCase(); // 'a', 's', '1', '!', etc.
    }
    // Si c'est une clé multi-caractères non listée comme spéciale, ou une faute de frappe
    else {
        console.warn(`Touche non reconnue ou format de raccourci invalide: "${rawKey}"`);
        return null; // Considérer comme un format de clé invalide
    }

    // Validation finale: vérifier si la clé est dans un format que robotjs supporte généralement
    if (key.length === 1 || key.startsWith('F') || specialKeys.includes(key)) {
        return { key, modifiers };
    }

    return null; // Retourne null si la clé n'est pas supportée après toutes les vérifications
}


export function createServer() {
  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json()); // Pour analyser le corps des requêtes JSON
  app.use(express.urlencoded({ extended: true })); // Pour analyser le corps des requêtes URL encodées

  // Exemple de routes API (démos)
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Route API pour récupérer la configuration (pages et boutons)
  app.get("/api/config", async (_req, res) => {
    try {
      const config = await readConfig();
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ error: "Échec de la récupération de la configuration." });
    }
  });

  // Route API pour sauvegarder la configuration
  app.post("/api/config", async (req, res) => {
    try {
      const newConfig = req.body;
      await writeConfig(newConfig);
      res.status(200).json({ message: "Configuration sauvegardée avec succès." });
    } catch (error) {
      res.status(500).json({ error: "Échec de la sauvegarde de la configuration." });
    }
  });

  // Route API pour exécuter des commandes ou des raccourcis clavier
  app.post("/api/execute-action", (req, res) => {
    const { command, shortcut } = req.body;

    if (!command && !shortcut) {
      return res.status(400).json({ error: "No command or shortcut provided." });
    }

    if (command) {
        // Exécution de commande shell standard (comme 'start chrome.exe' ou 'nircmd.exe')
        console.log(`Tentative d'exécution de la commande : ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erreur d'exécution de la commande : ${error.message}`);
                return res.status(500).json({ error: `Échec de l'exécution de la commande : ${error.message}`, stderr: stderr });
            }
            if (stderr) {
                console.warn(`Stderr : ${stderr}`);
            }
            console.log(`Stdout : ${stdout}`);
            res.status(200).json({ message: `Commande "${command}" exécutée avec succès`, stdout: stdout, stderr: stderr });
        });
    } else if (shortcut) {
        // Exécution de raccourci clavier via robotjs
        const parsed = parseShortcut(shortcut);
        if (parsed) {
            try {
                // Log ce qui est passé à robotjs pour le débogage
                console.log(`Appel de robot.keyTap avec clé: '${parsed.key}', modificateurs: [${parsed.modifiers.map(m => `'${m}'`).join(', ')}]`);
                robot.keyTap(parsed.key, parsed.modifiers);
                console.log(`Raccourci "${shortcut}" exécuté via robotjs.`);
                res.status(200).json({ message: `Raccourci "${shortcut}" exécuté avec succès.` });
            } catch (e: any) {
                console.error(`Erreur lors de l'exécution du raccourci avec robotjs : ${e.message}`);
                // Retourner une erreur plus détaillée si robotjs échoue
                return res.status(500).json({ error: `Échec de l'exécution du raccourci "${shortcut}" : ${e.message}. Veuillez vérifier que les prérequis de robotjs sont installés (Python, Build Tools).` });
            }
        } else {
            console.warn(`Format de raccourci invalide : ${shortcut}`);
            return res.status(400).json({ error: `Format de raccourci invalide : "${shortcut}". Vérifiez la syntaxe (ex: Ctrl+Shift+S) ou la touche n'est pas supportée.` });
        }
    }
  });

  // Route API pour redémarrer le serveur (nécessite PM2 pour un vrai redémarrage)
  app.post("/api/restart-server", (req, res) => {
    console.log("Requête de redémarrage du serveur reçue.");
    const appName = "stream-deck-server"; // Nom de votre application PM2 (utilisé avec pm2 start --name)

    exec(`pm2 restart ${appName}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur lors du redémarrage PM2 : ${error.message}`);
        return res.status(500).json({ error: `Échec du redémarrage du serveur via PM2 : ${error.message}`, stderr: stderr });
      }
      if (stderr) {
        console.warn(`Stderr PM2 : ${stderr}`);
      }
      console.log(`Stdout PM2 : ${stdout}`);
      res.status(200).json({ message: `Serveur ${appName} redémarré avec succès via PM2.` });
    });
  });

  return app;
}