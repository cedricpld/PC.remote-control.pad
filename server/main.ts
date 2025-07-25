import os from "os";
import express_namespace from "express";
const express = express_namespace.default || express_namespace;
import cors from "cors";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import { Yeelight } from 'node-yeelight-wifi';
import { handleDemo } from "./routes/demo";

// --- Définitions globales pour la compatibilité ---
// C'est la méthode la plus fiable pour obtenir __dirname dans différents contextes (dev/prod)
const __dirname = path.dirname(process.argv[1]);
const CONFIG_FILE = path.join(process.cwd(), 'config.json');


// --- Fonctions utilitaires ---

async function readConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`Config file not found at ${CONFIG_FILE}, creating default.`);
      return [];
    }
    console.error("Error reading config file:", error);
    throw error;
  }
}

async function writeConfig(config: any) {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`Config saved successfully to ${CONFIG_FILE}.`);
  } catch (error) {
    console.error("Error writing config file:", error);
    throw error;
  }
}

async function controlYeelight(action: 'toggle' | 'on' | 'off', ip: string) {
    // La logique Yeelight reste la même
    if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      throw new Error('Adresse IP de l\'ampoule Yeelight invalide ou manquante.');
    }
    return new Promise((resolve, reject) => {
        const yeelight = new Yeelight({ ip: ip, port: 55443 });
        // ... (le reste du code Yeelight)
    });
}

// --- Création du serveur Express ---

// On ajoute "export" pour que vite.config.ts puisse l'importer en mode dev
export function createServer() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // --- Toutes vos routes API ---
    app.post("/api/execute-action", (req, res) => {
        const { command, shortcut } = req.body;
        if (command) {
            exec(command, (error, stdout, stderr) => {
                if (error) return res.status(500).json({ error: `Execution failed: ${error.message}`, stderr });
                res.status(200).json({ message: `Command "${command}" executed`, stdout, stderr });
            });
        } else if (shortcut) {
            const scriptPath = path.join(__dirname, 'scripts', 'simulate-shortcut.ps1');
            const psCommand = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" -Shortcut "${shortcut}"`;
            exec(psCommand, (error, stdout, stderr) => {
                if (error) return res.status(500).json({ error: `Shortcut simulation failed for "${shortcut}"`, details: error.message, stderr });
                res.status(200).json({ message: `Shortcut "${shortcut}" simulated successfully.` });
            });
        } else {
            return res.status(400).json({ error: "No command or shortcut provided." });
        }
    });

    // ... Collez ici TOUTES les autres routes API que vous avez ...
    // (/api/get-cpu-usage, /api/get-gpu-usage, /api/set-master-volume, etc.)

    return app;
}


// --- Démarrage du serveur pour la production (quand il est packagé en .exe) ---
// Cette condition vérifie si le script est exécuté directement, et non importé.
if (require.main === module) {
    const app = createServer();
    const port = process.env.PORT || 3467;
    
    // Logique pour servir les fichiers de l'interface utilisateur
    const distPath = path.join(__dirname, "../spa");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
}