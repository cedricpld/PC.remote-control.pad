import express_namespace from "express";
const express = express_namespace.default || express_namespace;
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
// import bodyParser from "body-parser"; // Garder commenté si vous avez eu des problèmes avec en dev

// NOUVEAU: Importation du module 'os' de Node.js pour les stats système
import os from "os";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { Yeelight } from 'node-yeelight-wifi';

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

async function readConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`Fichier de configuration non trouvé à ${CONFIG_FILE}, création d'une configuration par défaut.`);
      return [];
    }
    console.error("Erreur lors de la lecture du fichier de configuration :", error);
    throw error;
  }
}

async function writeConfig(config: any) {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`Configuration sauvegardée avec succès à ${CONFIG_FILE}.`);
  } catch (error) {
    console.error("Erreur lors de l'écriture du fichier de configuration :", error);
    throw error;
  }
}

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

  app.use(cors());
  // UTILISER express.json() et express.urlencoded() SI body-parser pose problème en dev
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));


  // Routes API
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  app.get("/api/config", async (_req, res) => {
    try {
      const config = await readConfig();
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ error: "Échec de la récupération de la configuration." });
    }
  });

  app.post("/api/config", async (req, res) => {
    try {
      const newConfig = req.body;
      await writeConfig(newConfig);
      res.status(200).json({ message: "Configuration sauvegardée avec succès." });
    } catch (error) {
      res.status(500).json({ error: "Échec de la sauvegarde de la configuration." });
    }
  });

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

  // NOUVEAU: Route API pour le slider de volume maître
  app.post("/api/set-master-volume", (req, res) => {
    const { value } = req.body; // La valeur du volume du slider

    if (typeof value === 'undefined' || value === null || isNaN(Number(value))) {
      return res.status(400).json({ error: "Valeur de volume manquante ou invalide." });
    }

    // Assurez-vous que nircmd.exe est dans le PATH ou utilisez le chemin complet
    const volumeCommand = `nircmd.exe setsysvolume ${Math.min(Math.max(0, value), 65535)}`; // Clamper la valeur entre 0 et 65535

    console.log(`Tentative de définir le volume maître : ${value} avec la commande: ${volumeCommand}`);
    exec(volumeCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur d'exécution de la commande volume : ${error.message}`);
        return res.status(500).json({ error: `Échec de la définition du volume : ${error.message}`, stderr: stderr });
      }
      if (stderr) {
        console.warn(`Stderr volume : ${stderr}`);
      }
      console.log(`Stdout volume : ${stdout}`);
      res.status(200).json({ message: `Volume défini à ${value} avec succès.` });
    });
  });

  // NOUVEAU: Route API pour récupérer l'utilisation du CPU
  app.get("/api/get-cpu-usage", (req, res) => {
    // os.loadavg() retourne la charge moyenne du système sur 1, 5, et 15 minutes.
    // Pourcentage CPU = (charge moyenne sur 1 min) / (nombre de cœurs CPU) * 100
    const cpuLoad = os.loadavg()[0]; // Charge moyenne sur 1 minute
    const numCpus = os.cpus().length; // Nombre de cœurs CPU

    // C'est une estimation simple et rapide. Pour des stats plus précises, 'systeminformation' est mieux.
    const cpuUsagePercent = parseFloat(((cpuLoad / numCpus) * 100).toFixed(1));

    console.log(`CPU Usage demandé. Valeur: ${cpuUsagePercent}%`);
    res.status(200).json({ value: cpuUsagePercent });
  });

  // NOUVEAU: Route API pour récupérer l'utilisation de la RAM
  app.get("/api/get-ram-usage", (req, res) => {
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;

    const usedMemGB = parseFloat((usedMemBytes / (1024 * 1024 * 1024)).toFixed(2));
    const totalMemGB = parseFloat((totalMemBytes / (1024 * 1024 * 1024)).toFixed(2));
    const usedMemPercent = parseFloat(((usedMemBytes / totalMemBytes) * 100).toFixed(1));

    console.log(`RAM Usage demandé. Utilisé: ${usedMemGB} GB / ${totalMemGB} GB (${usedMemPercent}%)`);
    res.status(200).json({ value: usedMemPercent, usedGB: usedMemGB, totalGB: totalMemGB });
  });


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

  return app;
}