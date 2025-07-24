import os from "os";
import express_namespace from "express"; // Importez Express de manière robuste
const express = express_namespace.default || express_namespace; // Prenez l'export par défaut ou le namespace complet
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
// SUPPRIMÉ : import bodyParser from "body-parser"; // Cette ligne est supprimée

// Importations et définitions pour __dirname en ES Modules
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import de la bibliothèque Yeelight
import { Yeelight } from 'node-yeelight-wifi';

// Chemin de configuration: utilise process.cwd() pour la compatibilité avec le .exe packagé.
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

// Fonction d'aide pour parser les raccourcis clavier pour le script PowerShell
function parseShortcut(shortcut: string): { key: string, modifiers: string[] } | null {
    const parts = shortcut.split('+').map(p => p.trim());
    let rawKey = parts[parts.length - 1];

    const modifiers: string[] = [];
    for (let i = 0; i < parts.length - 1; i++) {
        const mod = parts[i].toLowerCase();
        if (mod === 'ctrl') modifiers.push('control');
        else if (mod === 'alt') modifiers.push('alt');
        else if (mod === 'shift') modifiers.push('shift');
        else if (mod === 'win' || mod === 'windows') modifiers.push('meta');
    }

    let key: string;
    const specialKeys = [
        'backspace', 'delete', 'enter', 'escape', 'space', 'tab',
        'up', 'down', 'left', 'right', 'home', 'end', 'pageup', 'pagedown',
        'capslock', 'numlock', 'scrolllock', 'printscreen', 'pause', 'insert',
        'menu',
        'leftmouse', 'rightmouse', 'middlemouse', 'doubleclick', 'rightclick', 'leftclick'
    ];

    if (specialKeys.includes(rawKey.toLowerCase())) {
        key = rawKey.toLowerCase();
    }
    else if (rawKey.toLowerCase().startsWith('f') && rawKey.length > 1 && !isNaN(parseInt(rawKey.substring(1)))) {
        key = rawKey.toUpperCase();
    }
    else if (rawKey.length === 1) {
        key = rawKey.toLowerCase();
    }
    else {
        console.warn(`Touche non reconnue ou format de raccourci invalide: "${rawKey}"`);
        return null;
    }

    if (key.length === 1 || key.startsWith('F') || specialKeys.includes(key)) {
        return { key, modifiers };
    }

    return null;
}

// Fonction pour contrôler l'ampoule Yeelight
async function controlYeelight(action: 'toggle' | 'on' | 'off', ip: string) {
  if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    throw new Error('Adresse IP de l\'ampoule Yeelight invalide ou manquante.');
  }

  return new Promise((resolve, reject) => {
    const yeelight = new Yeelight({ ip: ip, port: 55443 });

    let connected = false;
    let timeoutId: NodeJS.Timeout;

    const cleanup = () => {
      clearTimeout(timeoutId);
      yeelight.removeAllListeners();
      yeelight.disconnect();
    };

    yeelight.on('connected', () => {
      connected = true;
      console.log(`Yeelight: Connecté à ${ip}. Exécution de l'action: ${action}`);
      yeelight.setPower(action)
        .then(() => {
          console.log(`Yeelight: Ampoule ${action} avec succès.`);
          cleanup();
          resolve(`Ampoule Yeelight ${action} avec succès.`);
        })
        .catch((err: any) => {
          console.error(`Yeelight: Échec de l'action ${action}:`, err);
          cleanup();
          reject(`Contrôle Yeelight échoué: ${err.message}`);
        });
    });

    yeelight.on('disconnected', () => {
      console.log('Yeelight: Déconnecté.');
      if (!connected) {
        cleanup();
        reject('Contrôle Yeelight échoué: Déconnecté avant que la commande ne puisse être envoyée. L\'ampoule est-elle en ligne et le mode développeur activé ?');
      }
    });

    yeelight.on('error', (err: any) => {
      console.error('Yeelight: Erreur lors du contrôle:', err);
      cleanup();
      reject(`Contrôle Yeelight échoué: ${err.message}`);
    });

    timeoutId = setTimeout(() => {
      if (!connected) {
        console.warn('Yeelight: Connexion expirée.');
        cleanup();
        reject('Contrôle Yeelight échoué: Connexion expirée. L\'ampoule est-elle en ligne et le mode développeur activé ?');
      }
    }, 5000);

    yeelight.connect();
  });
}


export function createServer() {
  const app = express();

  // Middlewares : REVENIR AUX MIDDLEWARES EXPRESS INTÉGRÉS
  app.use(cors());
  app.use(express.json()); // Utilise express.json()
  app.use(express.urlencoded({ extended: true })); // Utilise express.urlencoded()

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
        const scriptPath = path.join(__dirname, 'scripts', 'simulate-shortcut.ps1');
        const psCommand = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" -Shortcut "${shortcut}"`;

        console.log(`Tentative de simuler le raccourci via PowerShell: ${psCommand}`);
        exec(psCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erreur d'exécution du script PowerShell: ${error.message}`);
                return res.status(500).json({ error: `Échec de la simulation du raccourci "${shortcut}" via PowerShell.`, details: error.message, stderr: stderr });
            }
            if (stderr) {
                console.warn(`Stderr PowerShell: ${stderr}`);
            }
            console.log(`Stdout PowerShell: ${stdout}`);
            res.status(200).json({ message: `Raccourci "${shortcut}" simulé avec succès via PowerShell.` });
        });
    }
  });

  // Route API pour contrôler l'ampoule Yeelight
  app.post("/api/yeelight-toggle", async (req, res) => {
    const { action, yeelightIp } = req.body;

    if (!['toggle', 'on', 'off'].includes(action)) {
      return res.status(400).json({ error: "Action Yeelight invalide. Doit être 'toggle', 'on', ou 'off'." });
    }
    if (!yeelightIp) {
      return res.status(400).json({ error: "L'adresse IP de l'ampoule Yeelight est manquante." });
    }

    try {
      const message = await controlYeelight(action, yeelightIp);
      res.status(200).json({ message });
    } catch (error: any) {
      console.error("Erreur API Yeelight:", error);
      res.status(500).json({ error: `Contrôle Yeelight échoué: ${error.message}` });
    }
  });


  // Route API pour redémarrer le serveur
  app.post("/api/restart-server", (req, res) => {
    console.log("Requête de redémarrage du serveur reçue.");
    const appName = "stream-deck-server";

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

  // NOUVEAU: Route API pour le slider de volume maître
  app.post("/api/set-master-volume", (req, res) => {
    const { value } = req.body;
    if (typeof value === 'undefined' || value === null || isNaN(Number(value))) {
      return res.status(400).json({ error: "Valeur de volume manquante ou invalide." });
    }
    const volumeCommand = `nircmd.exe setsysvolume ${Math.min(Math.max(0, value), 65535)}`;
    exec(volumeCommand, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: `Échec de la commande volume : ${error.message}`, stderr });
      }
      res.status(200).json({ message: `Volume défini à ${value} avec succès.` });
    });
  });

  // AMÉLIORÉ: Utilisation de PowerShell WMI pour une mesure fiable et indépendante de la langue
  app.get("/api/get-cpu-usage", (_req, res) => {
    const command = "powershell.exe -Command \"(Get-WmiObject -Class Win32_PerfFormattedData_PerfOS_Processor | Where-Object {$_.Name -eq '_Total'}).PercentProcessorTime\"";
    
    exec(command, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error("Erreur de la commande CPU (Get-WmiObject):", error || stderr);
        return res.status(500).json({ error: "Impossible de récupérer l'usage CPU via WMI." });
      }
      
      const usage = parseFloat(stdout.trim().replace(',', '.'));
      if (!isNaN(usage)) {
        return res.status(200).json({ value: parseFloat(usage.toFixed(1)) });
      }
      
      return res.status(500).json({ error: "Réponse invalide de la commande CPU." });
    });
  });

  // NOUVEAU: Route API pour l'utilisation du GPU (CUDA)
  app.get("/api/get-cuda-usage", (_req, res) => {
    const command = 'nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits';
    exec(command, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error("Erreur nvidia-smi (GPU):", error || stderr);
        return res.status(500).json({ error: "NVIDIA-SMI non trouvé. GPU NVIDIA requis." });
      }
      const usage = parseFloat(stdout.trim());
      if (!isNaN(usage)) {
        return res.status(200).json({ value: usage });
      }
      return res.status(500).json({ error: "Réponse invalide de nvidia-smi." });
    });
  });

  // NOUVEAU: Route API pour l'utilisation de la VRAM en %
  app.get("/api/get-vram-usage-percent", (_req, res) => {
    const command = 'nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits';
    exec(command, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error("Erreur nvidia-smi (VRAM):", error || stderr);
        return res.status(500).json({ error: "NVIDIA-SMI non trouvé. GPU NVIDIA requis." });
      }
      const [used, total] = stdout.trim().split(',').map(parseFloat);
      if (!isNaN(used) && !isNaN(total) && total > 0) {
        const percentage = (used / total) * 100;
        return res.status(200).json({ value: parseFloat(percentage.toFixed(1)) });
      }
      return res.status(500).json({ error: "Réponse invalide de nvidia-smi pour la VRAM." });
    });
  });

  // NOUVEAU: Route API pour l'utilisation de la VRAM en Go
  app.get("/api/get-vram-usage-gb", (_req, res) => {
    const command = 'nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits';
    exec(command, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error("Erreur nvidia-smi (VRAM):", error || stderr);
        return res.status(500).json({ error: "NVIDIA-SMI non trouvé. GPU NVIDIA requis." });
      }
      const usedMb = parseFloat(stdout.trim());
      if (!isNaN(usedMb)) {
        const usedGb = usedMb / 1024;
        return res.status(200).json({ value: parseFloat(usedGb.toFixed(2)) });
      }
      return res.status(500).json({ error: "Réponse invalide de nvidia-smi pour la VRAM." });
    });
  });


  // NOUVEAU: Route API pour récupérer l'utilisation de la RAM
  app.get("/api/get-ram-usage", (_req, res) => {
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    const usedMemPercent = parseFloat(((usedMemBytes / totalMemBytes) * 100).toFixed(1));
    res.status(200).json({ value: usedMemPercent });
  });

  return app;
}