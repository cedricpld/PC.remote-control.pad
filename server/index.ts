import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { exec } from "child_process";
import fs from "fs/promises"; // Importez le module fs/promises pour les opérations asynchrones sur les fichiers
import path from "path"; // Importez le module path pour gérer les chemins de fichiers

const CONFIG_FILE = path.join(__dirname, 'config.json'); // Chemin vers le fichier de configuration

// Fonction pour lire la configuration
async function readConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn("Fichier de configuration non trouvé, création d'une configuration par défaut.");
      return []; // Retourne un tableau vide si le fichier n'existe pas
    }
    console.error("Erreur lors de la lecture du fichier de configuration :", error);
    throw error;
  }
}

// Fonction pour écrire la configuration
async function writeConfig(config: any) {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log("Configuration sauvegardée avec succès.");
  } catch (error) {
    console.error("Erreur lors de l'écriture du fichier de configuration :", error);
    throw error;
  }
}

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes API existantes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // NOUVELLE ROUTE: Récupérer la configuration
  app.get("/api/config", async (_req, res) => {
    try {
      const config = await readConfig();
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ error: "Échec de la récupération de la configuration." });
    }
  });

  // NOUVELLE ROUTE: Sauvegarder la configuration
  app.post("/api/config", async (req, res) => {
    try {
      const newConfig = req.body;
      await writeConfig(newConfig);
      res.status(200).json({ message: "Configuration sauvegardée avec succès." });
    } catch (error) {
      res.status(500).json({ error: "Échec de la sauvegarde de la configuration." });
    }
  });

  // Route API pour exécuter des commandes ou des raccourcis
  app.post("/api/execute-action", (req, res) => {
    const { command, shortcut } = req.body;

    if (!command && !shortcut) {
      return res.status(400).json({ error: "No command or shortcut provided." });
    }

    let cmdToExecute: string;
    if (command) {
      cmdToExecute = command;
    } else if (shortcut) {
      console.warn(`Raccourci reçu : "${shortcut}". L'exécution d'un raccourci nécessite une bibliothèque comme 'robotjs'.`);
      return res.status(200).json({ message: `Raccourci "${shortcut}" reçu. (Nécessite robotjs pour être exécuté)`, shortcut: shortcut });
    } else {
        return res.status(400).json({ error: "Requête invalide : spécifiez 'command' ou 'shortcut'." });
    }

    console.log(`Tentative d'exécution de la commande : ${cmdToExecute}`);

    exec(cmdToExecute, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur d'exécution de la commande : ${error.message}`);
        return res.status(500).json({ error: `Échec de l'exécution de la commande : ${error.message}`, stderr: stderr });
      }
      if (stderr) {
        console.warn(`Stderr : ${stderr}`);
      }
      console.log(`Stdout : ${stdout}`);
      res.status(200).json({ message: `Commande "${cmdToExecute}" exécutée avec succès`, stdout: stdout, stderr: stderr });
    });
  });

  // Route API pour redémarrer le serveur
  app.post("/api/restart-server", (req, res) => {
    console.log("Requête de redémarrage du serveur reçue.");
    res.status(200).json({ message: "Redémarrage du serveur initié. Le service sera temporairement indisponible." });

    setTimeout(() => {
        process.exit(0);
    }, 1000);
  });

  return app;
}