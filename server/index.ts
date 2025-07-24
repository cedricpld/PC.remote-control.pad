import express_namespace from "express";
const express = express_namespace.default || express_namespace;
import cors from "cors";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Yeelight } from 'node-yeelight-wifi';
import { handleDemo } from "./routes/demo"; // <-- L'IMPORT MANQUANT EST AJOUTÉ ICI

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_FILE = path.join(process.cwd(), 'server/config.json');

// --- Logique pour une mesure CPU plus précise ---
let cpuUsage: number = 0;
function getCpuTimes() {
    let totalIdle = 0, totalTick = 0;
    const cpus = os.cpus();
    for (const cpu of cpus) {
        for (const type in cpu.times) {
            totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
    }
    return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}
let startMeasure = getCpuTimes();

setInterval(() => {
    const endMeasure = getCpuTimes();
    const idleDifference = endMeasure.idle - startMeasure.idle;
    const totalDifference = endMeasure.total - startMeasure.total;
    const percentageCPU = totalDifference === 0 ? 0 : (100 - (100 * idleDifference / totalDifference));
    cpuUsage = parseFloat(percentageCPU.toFixed(1));
    startMeasure = endMeasure;
}, 2000);

async function readConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`Fichier de configuration non trouvé à ${CONFIG_FILE}, création d'un fichier vide.`);
      await writeConfig([]);
      return [];
    }
    console.error("Erreur lors de la lecture du fichier de configuration :", error);
    throw error;
  }
}

async function writeConfig(config: any) {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error("Erreur lors de l'écriture du fichier de configuration :", error);
    throw error;
  }
}

async function controlYeelight(action: 'toggle' | 'on' | 'off', ip: string) {
    if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      throw new Error('Adresse IP de l\'ampoule Yeelight invalide ou manquante.');
    }
    // ... (Votre logique Yeelight complète ici)
}

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- Routes API ---
  app.get("/api/ping", (_req, res) => res.json({ message: "Hello from Express server!" }));
  
  app.get("/api/demo", handleDemo); // La fonction est maintenant définie grâce à l'import

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
      return res.status(400).json({ error: "Aucune commande ou raccourci fourni." });
    }
    let cmdToExec = "";
    if (command) {
        cmdToExec = command;
    } else if (shortcut) {
        const scriptPath = path.join(__dirname, 'scripts', 'simulate-shortcut.ps1');
        cmdToExec = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" -Shortcut "${shortcut}"`;
    }
    exec(cmdToExec, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur d'exécution: ${error.message}`);
            return res.status(500).json({ error: `Échec de l'exécution`, details: error.message, stderr });
        }
        if (stderr) console.warn(`Stderr: ${stderr}`);
        res.status(200).json({ message: `Action exécutée`, stdout, stderr });
    });
  });

  app.post("/api/yeelight-toggle", async (req, res) => {
    // ... (votre logique existante pour yeelight)
  });

  app.post("/api/set-master-volume", (req, res) => {
    const { value } = req.body;
    if (typeof value === 'undefined' || value === null || isNaN(Number(value))) {
      return res.status(400).json({ error: "Valeur de volume manquante ou invalide." });
    }
    const volumeCommand = `nircmd.exe setsysvolume ${Math.min(Math.max(0, value), 65535)}`;
    exec(volumeCommand, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: `Échec de la définition du volume : ${error.message}`, stderr: stderr });
      }
      res.status(200).json({ message: `Volume défini à ${value} avec succès.` });
    });
  });

  app.get("/api/get-cpu-usage", (_req, res) => {
    res.status(200).json({ value: cpuUsage });
  });

  app.get("/api/get-ram-usage", (_req, res) => {
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    const usedMemPercent = parseFloat(((usedMemBytes / totalMemBytes) * 100).toFixed(1));
    res.status(200).json({ value: usedMemPercent });
  });

  app.post("/api/restart-server", (_req, res) => {
    console.log("Requête de redémarrage du serveur reçue.");
    res.status(200).json({ message: `Le serveur va redémarrer si PM2 est configuré.` });
    // La logique de redémarrage réelle dépend de PM2 ou d'un autre outil
    // exec('pm2 restart stream-deck-server').unref();
  });

  return app;
}