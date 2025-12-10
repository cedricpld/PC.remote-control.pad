import os from "os";
import express_namespace from "express"; // Importez Express de manière robuste
const express = express_namespace.default || express_namespace; // Prenez l'export par défaut ou le namespace complet
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import { exec } from 'child_process';
import bcrypt from 'bcrypt'; // Import de bcrypt pour le hachage des mots de passe
import axios from 'axios';
// Importations et définitions pour __dirname en ES Modules
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import de la bibliothèque Yeelight
import { Yeelight } from 'node-yeelight-wifi';


// --- SECTION DE SÉCURITÉ ---
// IMPORTANT : Changez ce mot de passe pour quelque chose de personnel et de complexe !
//const HASHED_PASSWORD = "$2a$12$QbJCQCnCozJp6UVvkYzZteOrK.fgELViltca6534m3RLh0XtqU08S"; // Mot de passe haché pour la sécurité
// Ce mot de passe est haché avec bcrypt. Vous pouvez le générer avec bcrypt
// Ce token secret sert de "ticket d'entrée" pour le client une fois connecté.
// Il n'a pas besoin d'être changé, mais il doit rester secret.
const AUTH_TOKEN = "$2y$10$GOYC7PD5VZDvLaf8u29DTe52oHW7SFaTtAj2bQP28I6iFoiBkipOa";

/**
 * Middleware de sécurité : le "garde du corps" de vos API.
 * Il vérifie si le client envoie le bon "ticket d'entrée" (token) dans les en-têtes de sa requête.
 */
//const ensureAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
//  const authHeader = req.headers['authorization'];
//  console.log('Authorization Header:', authHeader); // Log pour vérifier l'en-tête d'autorisation
//  if (authHeader && authHeader === `Bearer ${AUTH_TOKEN}`) {
//    return next();
//  }
//  res.status(401).json({ error: 'Accès non autorisé.' });
//};

// --- FIN DE LA SECTION SÉCURITÉ ---







// Chemin de configuration: utilise process.cwd() pour la compatibilité avec le .exe packagé.
const CONFIG_FILE = path.join(process.cwd(), 'config.json');
// CORRECTION : Chemin direct vers le nircmd.exe local pour la portabilité
const NIRCMD_PATH = path.join(__dirname, 'scripts', 'nircmd.exe');


// Fonction pour lire la configuration depuis config.json
async function readConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data);
    console.log("Configuration lue depuis le fichier:"); // Ajoutez ce log
    return config;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`Fichier de configuration non trouvé à ${CONFIG_FILE}`);
      return null;
    }
    console.error("Erreur lors de la lecture du fichier de configuration :", error.message);
    throw error;
  }
}




// Fonction pour écrire la configuration dans config.json
async function writeConfig(config: any) {
  try {
    // Ajouter un log pour vérification
    console.log("Sauvegarde de la configuration:");

    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`Configuration sauvegardée avec succès à ${CONFIG_FILE}.`);
  } catch (error) {
    console.error("Erreur lors de l'écriture du fichier de configuration :", error);
    throw error;
  }
}


// Yeelight connection cache
const yeelightConnections = new Map<string, { light: any; timeoutId: NodeJS.Timeout }>();

async function getManagedYeelight(ip: string): Promise<any> {
    if (yeelightConnections.has(ip)) {
        const existing = yeelightConnections.get(ip)!;
        clearTimeout(existing.timeoutId);
        return existing.light;
    }

    return new Promise((resolve, reject) => {
        const light = new Yeelight();
        light.host = ip;
        light.port = 55443;

        const connectionTimeout = setTimeout(() => {
            light.disconnect();
            reject(new Error('Connection timed out'));
        }, 5000);

        light.on('connected', () => {
            clearTimeout(connectionTimeout);
            const timeoutId = setTimeout(() => {
                light.disconnect();
                yeelightConnections.delete(ip);
            }, 60000); // 60 seconds inactivity timeout
            yeelightConnections.set(ip, { light, timeoutId });
            resolve(light);
        });

        light.on('error', (err: any) => {
            clearTimeout(connectionTimeout);
            reject(err);
        });

        light.connect();
    });
}

async function executeYeelightCommand(ip: string, command: (light: any) => Promise<any>) {
    const light = await getManagedYeelight(ip);
    // Reset the inactivity timeout for the connection
    const connection = yeelightConnections.get(ip)!;
    clearTimeout(connection.timeoutId);
    connection.timeoutId = setTimeout(() => {
        light.disconnect();
        yeelightConnections.delete(ip);
    }, 60000);
    return command(light);
}

// Fonction pour contrôler l'ampoule Yeelight
async function controlYeelight(action: 'toggle' | 'on' | 'off', ip: string) {
    return executeYeelightCommand(ip, async (light) => {
        if (action === 'toggle') {
            await light.updateState();
            await light.setPower(!light.power);
        } else {
            await light.setPower(action === 'on');
        }
        return `Ampoule Yeelight ${action} avec succès.`;
    });
}

// Fonction pour contrôler la luminosité de l'ampoule Yeelight
async function controlYeelightBrightness(ip: string, brightness: number) {
    if (brightness < 1 || brightness > 100) {
        throw new Error('La luminosité doit être comprise entre 1 et 100.');
    }
    return executeYeelightCommand(ip, async (light) => {
        await light.setBright(brightness);
        return `Luminosité de l'ampoule Yeelight réglée à ${brightness}% avec succès.`;
    });
}

// Fonction pour contrôler la température de couleur de l'ampoule Yeelight
async function controlYeelightColorTemperature(ip: string, colorTemp: number) {
    return executeYeelightCommand(ip, async (light) => {
        await light.setCT(colorTemp);
        return `Température de couleur réglée à ${colorTemp}K.`;
    });
}

// Fonction pour contrôler la couleur (RGB) de l'ampoule Yeelight
async function controlYeelightRGB(ip: string, color: string) {
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
    };
    const rgb = hexToRgb(color);
    if (!rgb) {
        throw new Error('Format de couleur hexadécimal invalide.');
    }
    return executeYeelightCommand(ip, async (light) => {
        await light.setRGB(rgb);
        return `Couleur réglée à ${color}.`;
    });
}

// Fonction pour contrôler la teinte (HSV) de l'ampoule Yeelight
async function controlYeelightHSV(ip: string, hue: number) {
    return executeYeelightCommand(ip, async (light) => {
        await light.setHSV([hue, 100, 100]);
        return `Teinte réglée à ${hue}.`;
    });
}


export function createServer() {
  const app = express();
  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));





  // --- NOUVELLE ROUTE DE CONNEXION (NON PROTÉGÉE) ---
  // Cette route est placée avant le middleware de sécurité pour être accessible publiquement.
  app.post("/api/login", async (req, res) => {
    const { password } = req.body;
    //const saltRounds = 12; // Nombre de tours de salage

    try {
      //console.log("Mot de passe reçu :", password);
      //console.log("Mot de passe haché stocké :", HASHED_PASSWORD);
      //const hashedPassword = await bcrypt.hash(password, saltRounds);
      //console.log("Mot de passe reçu haché :", hashedPassword);

      const config = await readConfig();
      if (!config || !config.auth || !config.auth.hashedPassword) {
        return res.status(500).json({ error: "Configuration de l'authentification manquante." });
      }

      const hashedPassword = config.auth.hashedPassword;
      const isMatch = await bcrypt.compare(password, hashedPassword);

      if (isMatch) {
        res.status(200).json({ token: AUTH_TOKEN });
      } else {
        res.status(401).json({ error: "Mot de passe incorrect" });
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du mot de passe :", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });






  // --- APPLICATION DU GARDE DU CORPS SUR LES ROUTES SENSIBLES ---
  // Ce middleware s'appliquera à toutes les routes /api/* définies après lui, sauf /api/login.
  //app.use('/api', (req, res, next) => {
  //    if (req.path === '/login') {
  //        return next();
  //    }
  //    ensureAuthenticated(req, res, next);
  //});





  // Routes API
  app.get("/api/ping", (_req, res) => res.json({ message: "Hello from Express server v2!" }));
  app.get("/api/demo", handleDemo);
  app.get("/api/config", async (_req, res) => {
    try {
      const config = await readConfig();
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ error: "Échec de la récupération de la configuration." });
    }
  });
  
  //#################################    Configuration sauvegardée avec succès à
  app.post("/api/config", async (req, res) => {
    try {
      const newConfig = req.body;
      await writeConfig(newConfig);
      res.status(200).json({ message: "Configuration sauvegardée avec succès." });
    } catch (error) {
      res.status(500).json({ error: "Échec de la sauvegarde de la configuration." });
    }
  });


  app.post("/api/update-password", async (req, res) => {
    //console.log("Données reçues pour changement de mot de passe:", req.body); // Log des données reçues

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Mot de passe actuel ou nouveau mot de passe manquant." });
    }

    try {
      const config = await readConfig();
      const hashedPassword = config.auth?.hashedPassword;
      if (!hashedPassword) {
        return res.status(500).json({ error: "Mot de passe non configuré." });
      }

      const isMatch = await bcrypt.compare(currentPassword, hashedPassword);
      console.log("Correspondance du mot de passe actuel :", isMatch); // Log du résultat de la comparaison

      if (!isMatch) {
        return res.status(401).json({ error: "Mot de passe actuel incorrect" });
      }

      const saltRounds = 12;
      const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

      config.auth.hashedPassword = newHashedPassword;
      await writeConfig(config);

      res.status(200).json({ message: "Mot de passe mis à jour avec succès." });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe :", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });





  
  // CORRIGÉ : Route API pour exécuter des actions
  app.post("/api/execute-action", (req, res) => {
    const { command, shortcut } = req.body;
    let finalCommand: string | null = null;
    
    if (command) {
      const trimmedCommand = command.trim();

      // **LOGIQUE AMÉLIORÉE POUR LES COMMANDES SPÉCIALES**

      // 1. Gère la commande pour jouer un son
      if (trimmedCommand.startsWith('PLAY_AUDIO')) {
        const filePath = trimmedCommand.substring('PLAY_AUDIO'.length).trim();
        if (!filePath) {
          return res.status(400).json({ error: "Chemin du fichier audio manquant après PLAY_AUDIO." });
        }
        const scriptPath = path.join(__dirname, 'scripts', 'play-audio.ps1');
        finalCommand = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" -FilePath "${filePath}"`;
        console.log(`Lancement du script audio : ${finalCommand}`);
      }
      
      // 2. NOUVEAU : Gère la commande pour arrêter tous les sons
      else if (trimmedCommand.startsWith('STOP_AUDIO')) {
        const scriptPath = path.join(__dirname, 'scripts', 'stop-audio.ps1');
        finalCommand = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`;
        console.log(`Lancement du script d'arrêt audio : ${finalCommand}`);
      }

      // 3. NOUVEAU : Gère la commande pour arrêter TOUS les sons
      else if (trimmedCommand.startsWith('STOP_ALL_AUDIO')) {
        const scriptPath = path.join(__dirname, 'scripts', 'stop-all-audio.ps1');
        finalCommand = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`;
        console.log(`Lancement du script d'arrêt de tous les sons : ${finalCommand}`);
      }

      // 3. Gère les autres commandes (logique existante)
      else if (trimmedCommand.startsWith('nircmd.exe')) {
        finalCommand = `"${NIRCMD_PATH}" ${trimmedCommand.substring('nircmd.exe'.length)}`;
      } else {
        finalCommand = trimmedCommand;
      }
    } 
    else if (shortcut) {
      const scriptPath = path.join(__dirname, 'scripts', 'simulate-shortcut.ps1');
      finalCommand = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" -Shortcut "${shortcut}"`;
    }
    
    if (!finalCommand) {
        return res.status(400).json({ error: "Aucune commande ou raccourci fourni." });
    }

    exec(finalCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur d'exécution : ${error.message}\nStderr: ${stderr}`);
            return res.status(500).json({ error: `Échec de l'exécution`, details: error.message, stderr });
        }
        if (stderr) console.warn(`Stderr : ${stderr}`);
        res.status(200).json({ message: `Action exécutée avec succès`, stdout });
    });
  });

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



// Nouvelle route pour contrôler la luminosité de l'ampoule Yeelight
app.post("/api/yeelight-brightness", async (req, res) => {
  const { brightness, yeelightIp } = req.body;

  if (!yeelightIp) {
    return res.status(400).json({ error: "L'adresse IP de Yeelight est manquante." });
  }

  if (brightness === undefined || brightness < 1 || brightness > 100) {
    return res.status(400).json({ error: "La luminosité doit être comprise entre 1 et 100." });
  }

  try {
    const message = await controlYeelightBrightness(yeelightIp, brightness);
    res.status(200).json({ message });
  } catch (error: any) {
    res.status(500).json({ error: `Réglage de la luminosité échoué: ${error.message}` });
  }
});

app.post("/api/yeelight-color-temp", async (req, res) => {
  const { colorTemp, yeelightIp } = req.body;

  if (!yeelightIp) {
    return res.status(400).json({ error: "L'adresse IP de Yeelight est manquante." });
  }

  if (colorTemp === undefined || colorTemp < 1700 || colorTemp > 6500) {
    return res.status(400).json({ error: "La température de couleur doit être comprise entre 1700 et 6500." });
  }

  try {
    const message = await controlYeelightColorTemperature(yeelightIp, colorTemp);
    res.status(200).json({ message });
  } catch (error: any) {
    res.status(500).json({ error: `Réglage de la température de couleur échoué: ${error.message}` });
  }
});

app.post("/api/yeelight-color", async (req, res) => {
    const { color, yeelightIp } = req.body;

    if (!yeelightIp) {
        return res.status(400).json({ error: "L'adresse IP de Yeelight est manquante." });
    }

    if (!color) {
        return res.status(400).json({ error: "La couleur est manquante." });
    }

    try {
        const message = await controlYeelightRGB(yeelightIp, color);
        res.status(200).json({ message });
    } catch (error: any) {
        res.status(500).json({ error: `Réglage de la couleur échoué: ${error.message}` });
    }
});

app.post("/api/yeelight-hue", async (req, res) => {
    const { hue, yeelightIp } = req.body;

    if (!yeelightIp) {
        return res.status(400).json({ error: "L'adresse IP de Yeelight est manquante." });
    }

    if (hue === undefined || hue < 0 || hue > 359) {
        return res.status(400).json({ error: "La teinte doit être comprise entre 0 et 359." });
    }

    try {
        const message = await controlYeelightHSV(yeelightIp, hue);
        res.status(200).json({ message });
    } catch (error: any) {
        res.status(500).json({ error: `Réglage de la teinte échoué: ${error.message}` });
    }
});







  
app.post("/api/restart-server", (req, res) => {
  res.status(200).json({ message: "Serveur en cours de redémarrage..." });

  // Chemin vers votre script PowerShell pour redémarrer le serveur
  const restartScriptPath = path.join(__dirname, '..', '..', 'control_pad_restart.ps1');

  // Commande pour exécuter le script PowerShell
  const command = `powershell.exe -ExecutionPolicy Bypass -File "${restartScriptPath}"`;

  // Exécuter le script PowerShell
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors du redémarrage du serveur: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erreur lors du redémarrage du serveur: ${stderr}`);
    }
    console.log(`Sortie du script de redémarrage: ${stdout}`);
  });

  // Arrêter le serveur actuel
  setTimeout(() => {
    console.log("Fermeture du serveur actuel...");
    process.exit(0);
  }, 100);
});


  
  app.post("/api/stop-server", (req, res) => {
    res.status(200).json({ message: "Serveur en cours d'arrêt..." });
    console.log("Fermeture du serveur...");
    process.exit(0); // Arrête le processus Node.js
  });


  app.post("/api/set-master-volume", (req, res) => {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: "Valeur de volume manquante." });
    // Utilisation du chemin local pour nircmd
    const volumeCommand = `"${NIRCMD_PATH}" setsysvolume ${Math.min(Math.max(0, value), 65535)}`;
    exec(volumeCommand, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: `Échec de la commande volume : ${error.message}`, stderr });
      }
      res.status(200).json({ message: `Volume défini à ${value}.` });
    });
  });
  // Routes de monitoring
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
    // Cette route est un alias pour /api/get-cuda-usage
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

  // --- Nouvelle approche pour Xiaomi via API JSON ---
  const XIAOMI_API_URL = 'http://192.168.1.76:5000/api/current';
  let xiaomiCache: { data: any; timestamp: number } | null = null;

  async function getXiaomiApiData() {
    const now = Date.now();
    // Utiliser le cache si les données ont moins de 5 secondes
    if (xiaomiCache && now - xiaomiCache.timestamp < 5000) {
      console.log("Utilisation du cache Xiaomi.");
      return xiaomiCache.data;
    }

    try {
      console.log("Récupération des données depuis l'API Xiaomi...");
      const { data } = await axios.get(XIAOMI_API_URL, { timeout: 5000 });
      xiaomiCache = { data, timestamp: now };
      return data;
    } catch (error: any) {
      console.error("Erreur détaillée lors de l'appel à l'API Xiaomi:", error.message);
      throw new Error("Impossible de contacter l'API de l'appareil Xiaomi.");
    }
  }

  // --- Routes pour Xiaomi ---
  app.get("/api/get-xiaomi-temperature", async (_req, res) => {
    try {
      const data = await getXiaomiApiData();
      res.status(200).json({ value: data.temperature });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/get-xiaomi-humidity", async (_req, res) => {
    try {
      const data = await getXiaomiApiData();
      res.status(200).json({ value: data.humidity });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/get-xiaomi-battery", async (_req, res) => {
    try {
      const data = await getXiaomiApiData();
      res.status(200).json({ value: data.battery });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return app;
}
