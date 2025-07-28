import os from "os";
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
// Import de la bibliothèque Yeelight
import { Yeelight } from 'node-yeelight-wifi';

// --- SECTION DE SÉCURITÉ ---
// IMPORTANT : Changez ce mot de passe pour quelque chose de personnel et de complexe !
const SUPER_SECRET_PASSWORD = "1973"; 
// Ce token secret sert de "ticket d'entrée" pour le client une fois connecté.
// Il n'a pas besoin d'être changé, mais il doit rester secret.
const AUTH_TOKEN = "un-token-secret-tres-long-et-aleatoire-pour-la-session";

/**
 * Middleware de sécurité : le "garde du corps" de vos API.
 * Il vérifie si le client envoie le bon "ticket d'entrée" (token) dans les en-têtes de sa requête.
 */
const ensureAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  console.log('Authorization Header:', authHeader); // Log pour vérifier l'en-tête d'autorisation
  if (authHeader && authHeader === `Bearer ${AUTH_TOKEN}`) {
    return next();
  }
  res.status(401).json({ error: 'Accès non autorisé.' });
};

// --- FIN DE LA SECTION SÉCURITÉ ---


// Chemin de configuration: utilise process.cwd() pour la compatibilité avec le .exe packagé.
const CONFIG_FILE = path.join(process.cwd(), 'config.json');
// CORRECTION : Chemin direct vers le nircmd.exe local pour la portabilité
const NIRCMD_PATH = path.join(__dirname, 'scripts', 'nircmd.exe');


// Fonction pour lire la configuration depuis config.json
async function readConfig() {
  try {
    console.log(`Tentative de lecture du fichier de configuration à ${CONFIG_FILE}`);
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    console.log('Fichier de configuration lu avec succès');
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


// Fonction pour écrire la configuration dans config.json (INCHANGÉE)
async function writeConfig(config: any) {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`Configuration sauvegardée avec succès à ${CONFIG_FILE}.`);
  } catch (error) {
    console.error("Erreur lors de l'écriture du fichier de configuration :", error);
    throw error;
  }
}

// Fonction pour contrôler l'ampoule Yeelight (INCHANGÉE)
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
  // Middlewares (INCHANGÉS)
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- NOUVELLE ROUTE DE CONNEXION (NON PROTÉGÉE) ---
  // Cette route est placée avant le middleware de sécurité pour être accessible publiquement.
  app.post("/api/login", (req, res) => {
    const { password } = req.body;
    // On vérifie si le mot de passe envoyé par le client correspond à celui défini sur le serveur.
    if (password === SUPER_SECRET_PASSWORD) {
      // Si c'est correct, on envoie le "ticket d'entrée" (token) au client.
      console.log("Tentative de connexion réussie.");
      res.status(200).json({ token: AUTH_TOKEN });
    } else {
      // Sinon, on renvoie une erreur 401 (Non autorisé).
      console.warn("Tentative de connexion échouée : mot de passe incorrect.");
      res.status(401).json({ error: "Mot de passe incorrect" });
    }
  });

  // --- APPLICATION DU GARDE DU CORPS SUR LES ROUTES SENSIBLES ---
  // Ce middleware s'appliquera à toutes les routes /api/* définies après lui, sauf /api/login.
  app.use('/api', (req, res, next) => {
      if (req.path === '/login') {
          return next();
      }
      ensureAuthenticated(req, res, next);
  });

  // --- VOS ROUTES EXISTANTES (MAINTENANT PROTÉGÉES) ---

  // Route Ping (INCHANGÉE, mais maintenant protégée)
  app.get("/api/ping", (_req, res) => res.json({ message: "Hello from Express server v2!" }));
  
  // Route Demo (INCHANGÉE, mais maintenant protégée)
  app.get("/api/demo", handleDemo);

  // Route pour lire la config
app.get("/api/config", async (req, res) => {
  try {
    console.log('Tentative de récupération de la configuration');
    const config = await readConfig();
    console.log('Configuration récupérée avec succès:', config);
    res.status(200).json(config);
  } catch (error) {
    console.error("Erreur lors de la récupération de la configuration:", error);
    res.status(500).json({ error: "Échec de la récupération de la configuration." });
  }
});


  // Route pour écrire la config (INCHANGÉE, mais maintenant protégée)
  app.post("/api/config", async (req, res) => {
    try {
      const newConfig = req.body;
      await writeConfig(newConfig);
      res.status(200).json({ message: "Configuration sauvegardée avec succès." });
    } catch (error) {
      res.status(500).json({ error: "Échec de la sauvegarde de la configuration." });
    }
  });
  
  // Route pour exécuter des actions (INCHANGÉE, mais maintenant protégée)
  app.post("/api/execute-action", (req, res) => {
    const { command, shortcut } = req.body;
    let finalCommand: string | null = null;
    console.log('Requête reçue sur /api/execute-action avec :', req.body);

    if (command) {
        if (command.startsWith('nircmd.exe')) {
            finalCommand = `"${NIRCMD_PATH}" ${command.substring('nircmd.exe'.length)}`;
        } else {
            finalCommand = command;
        }
    } else if (shortcut) {
        const scriptPath = path.join(__dirname, 'scripts', 'simulate-shortcut.ps1');
        finalCommand = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" -Shortcut "${shortcut}"`;
    }
    
    if (!finalCommand) {
        return res.status(400).json({ error: "Aucune commande ou raccourci fourni." });
    }

    console.log(`Exécution de la commande finale : ${finalCommand}`);
    exec(finalCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur d'exécution de la commande : ${error.message}`);
            return res.status(500).json({ error: `Échec de l'exécution : ${error.message}`, stderr });
        }
        if (stderr) console.warn(`Stderr : ${stderr}`);
        console.log(`Stdout : ${stdout}`);
        res.status(200).json({ message: `Action exécutée avec succès`, stdout, stderr });
    });
  });

  // Route Yeelight (INCHANGÉE, mais maintenant protégée)
  app.post("/api/yeelight-toggle", async (req, res) => {
    const { action, yeelightIp } = req.body;
    if (!['toggle', 'on', 'off'].includes(action)) return res.status(400).json({ error: "Action Yeelight invalide." });
    if (!yeelightIp) return res.status(400).json({ error: "L'adresse IP de Yeelight est manquante." });
    try {
      const message = await controlYeelight(action, yeelightIp);
      res.status(200).json({ message });
    } catch (error: any) {
      res.status(500).json({ error: `Contrôle Yeelight échoué: ${error.message}` });
    }
  });
  
  // Route pour redémarrer (INCHANGÉE, mais maintenant protégée)
  app.post("/api/restart-server", (req, res) => {
    res.status(200).json({ message: "Serveur en cours de redémarrage..." });
    const restartScriptPath = path.join(__dirname, '..', '..', 'control_pad_restart.ps1');
    const command = `powershell.exe -ExecutionPolicy Bypass -File "${restartScriptPath}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) console.error(`Erreur lors du redémarrage du serveur: ${error.message}`);
      if (stderr) console.error(`Erreur lors du redémarrage du serveur: ${stderr}`);
      console.log(`Sortie du script de redémarrage: ${stdout}`);
    });
    setTimeout(() => {
      console.log("Fermeture du serveur actuel...");
      process.exit(0);
    }, 100);
  });

  // Route pour arrêter le serveur (INCHANGÉE, mais maintenant protégée)
  app.post("/api/stop-server", (req, res) => {
    res.status(200).json({ message: "Serveur en cours d'arrêt..." });
    console.log("Fermeture du serveur...");
    process.exit(0);
  });

  // Route pour le volume (INCHANGÉE, mais maintenant protégée)
  app.post("/api/set-master-volume", (req, res) => {
    const { value } = req.body;

    if (value === undefined) {
      console.log("Valeur de volume manquante.");
      return res.status(400).json({ error: "Valeur de volume manquante." });
    }

    const volumeCommand = `"${NIRCMD_PATH}" setsysvolume ${Math.min(Math.max(0, value), 65535)}`;
    console.log(`Définition du volume à ${value} avec la commande : ${volumeCommand}`);

    exec(volumeCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur de la commande volume : ${error.message}`);
        console.error(`Stderr: ${stderr}`);
        return res.status(500).json({ error: `Échec de la commande volume : ${error.message}`, stderr });
      }

      console.log(`Volume défini à ${value} avec succès.`);
      console.log(`Sortie standard: ${stdout}`);

      res.status(200).json({ message: `Volume défini à ${value}.` });
    });
  });



  // Routes de monitoring (INCHANGÉES, mais maintenant protégées)
  app.get("/api/get-cpu-usage", (_req, res) => {
    const command = "powershell.exe -Command \"(Get-WmiObject -Class Win32_PerfFormattedData_PerfOS_Processor | Where-Object {$_.Name -eq '_Total'}).PercentProcessorTime\"";
    exec(command, (error, stdout, stderr) => {
      if (error || stderr) {
        return res.status(500).json({ error: "Impossible de récupérer l'usage CPU via WMI." });
      }
      const usage = parseFloat(stdout.trim().replace(',', '.'));
      if (!isNaN(usage)) return res.status(200).json({ value: parseFloat(usage.toFixed(1)) });
      return res.status(500).json({ error: "Réponse invalide de la commande CPU." });
    });
  });
  app.get("/api/get-cuda-usage", (_req, res) => {
    const command = 'nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits';
    exec(command, (error, stdout, stderr) => {
      if (error || stderr) return res.status(500).json({ error: "NVIDIA-SMI non trouvé. GPU NVIDIA requis." });
      const usage = parseFloat(stdout.trim());
      if (!isNaN(usage)) return res.status(200).json({ value: usage });
      return res.status(500).json({ error: "Réponse invalide de nvidia-smi." });
    });
  });
  app.get("/api/get-gpu-usage", (_req, res) => {
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
  app.get("/api/get-vram-usage-percent", (_req, res) => {
    const command = 'nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits';
    exec(command, (error, stdout, stderr) => {
      if (error || stderr) return res.status(500).json({ error: "NVIDIA-SMI non trouvé. GPU NVIDIA requis." });
      const [used, total] = stdout.trim().split(',').map(parseFloat);
      if (!isNaN(used) && !isNaN(total) && total > 0) {
        const percentage = (used / total) * 100;
        return res.status(200).json({ value: parseFloat(percentage.toFixed(1)) });
      }
      return res.status(500).json({ error: "Réponse invalide de nvidia-smi pour la VRAM." });
    });
  });
  app.get("/api/get-vram-usage-gb", (_req, res) => {
    const command = 'nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits';
    exec(command, (error, stdout, stderr) => {
      if (error || stderr) return res.status(500).json({ error: "NVIDIA-SMI non trouvé. GPU NVIDIA requis." });
      const usedMb = parseFloat(stdout.trim());
      if (!isNaN(usedMb)) {
        const usedGb = usedMb / 1024;
        return res.status(200).json({ value: parseFloat(usedGb.toFixed(2)) });
      }
      return res.status(500).json({ error: "Réponse invalide de nvidia-smi pour la VRAM." });
    });
  });
  app.get("/api/get-ram-usage", (_req, res) => {
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    const usedMemPercent = parseFloat(((usedMemBytes / totalMemBytes) * 100).toFixed(1));
    res.status(200).json({ value: usedMemPercent });
  });
  
  return app;
}
