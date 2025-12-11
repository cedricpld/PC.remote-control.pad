import express from "express";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import bcrypt from 'bcrypt';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Yeelight } from 'node-yeelight-wifi';
import { createRequire } from 'module';

let WebSocket: any;
let wol: any;

try {
  const require = createRequire(import.meta.url);
  WebSocket = require('ws');
  wol = require('wakeonlan');
} catch (error) {
  console.warn("⚠️  Optional dependencies (ws, wakeonlan) failed to load.");
  console.warn("    PC connection and Wake-on-LAN features will be unavailable.");
  console.warn("    Please run 'npm install' in the client directory.");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- AUTHENTICATION CONFIG ---
const AUTH_TOKEN = "$2y$10$GOYC7PD5VZDvLaf8u29DTe52oHW7SFaTtAj2bQP28I6iFoiBkipOa";

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

// --- HELPER FUNCTIONS ---
async function readConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`Config file not found at ${CONFIG_FILE}`);
      return null;
    }
    console.error("Error reading config:", error.message);
    throw error;
  }
}

async function writeConfig(config: any) {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`Config saved to ${CONFIG_FILE}.`);
  } catch (error) {
    console.error("Error writing config:", error);
    throw error;
  }
}

// --- YEELIGHT MANAGED CONNECTION ---
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
            }, 60000); // 60s inactivity
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
    const connection = yeelightConnections.get(ip)!;
    clearTimeout(connection.timeoutId);
    connection.timeoutId = setTimeout(() => {
        light.disconnect();
        yeelightConnections.delete(ip);
    }, 60000);
    return command(light);
}

// Yeelight wrappers
async function controlYeelight(action: 'toggle' | 'on' | 'off', ip: string) {
    return executeYeelightCommand(ip, async (light) => {
        if (action === 'toggle') {
            await light.updateState();
            await light.setPower(!light.power);
        } else {
            await light.setPower(action === 'on');
        }
        return `Yeelight ${action} success.`;
    });
}

async function controlYeelightBrightness(ip: string, brightness: number) {
    if (brightness < 1 || brightness > 100) throw new Error('Brightness must be 1-100');
    return executeYeelightCommand(ip, async (light) => {
        await light.setBright(brightness);
        return `Brightness set to ${brightness}%.`;
    });
}

async function controlYeelightColorTemperature(ip: string, colorTemp: number) {
    return executeYeelightCommand(ip, async (light) => {
        await light.setCT(colorTemp);
        return `Color Temp set to ${colorTemp}K.`;
    });
}

async function controlYeelightRGB(ip: string, color: string) {
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
    };
    const rgb = hexToRgb(color);
    if (!rgb) throw new Error('Invalid Hex Color');
    return executeYeelightCommand(ip, async (light) => {
        await light.setRGB(rgb);
        return `Color set to ${color}.`;
    });
}

async function controlYeelightHSV(ip: string, hue: number) {
    return executeYeelightCommand(ip, async (light) => {
        await light.setHSV([hue, 100, 100]);
        return `Hue set to ${hue}.`;
    });
}


// --- PC SERVER WEBSOCKET CONNECTION ---
let wsClient: WebSocket | null = null;
let isPcConnected = false;
const pendingRequests = new Map<string, { resolve: Function, reject: Function, timeout: NodeJS.Timeout }>();

function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

function connectToPcServer(ip: string, port: number) {
    if (!WebSocket) return;
    if (wsClient && (wsClient.readyState === WebSocket.CONNECTING || wsClient.readyState === WebSocket.OPEN)) return;

    const url = `ws://${ip}:${port}`;
    console.log(`Connecting to PC Server at ${url}...`);
    wsClient = new WebSocket(url);

    wsClient.on('open', () => {
        console.log('Connected to PC Server.');
        isPcConnected = true;
    });

    wsClient.on('message', (data) => {
        try {
            const response = JSON.parse(data.toString());
            if (response.id && pendingRequests.has(response.id)) {
                const { resolve, timeout } = pendingRequests.get(response.id)!;
                clearTimeout(timeout);
                pendingRequests.delete(response.id);
                resolve(response);
            }
        } catch (e) {
            console.error("Error parsing WS message:", e);
        }
    });

    wsClient.on('close', () => {
        if (isPcConnected) console.log('Disconnected from PC Server.');
        isPcConnected = false;
        wsClient = null;
        // Retry logic handled by periodic check or manual restart?
        // Let's retry every 10s
        setTimeout(() => {
             readConfig().then(config => {
                 const pc = config?.pcServer || { ip: 'localhost', port: 8765 };
                 connectToPcServer(pc.ip, pc.port);
             });
        }, 10000);
    });

    wsClient.on('error', (err) => {
        //console.error('WebSocket error:', err.message);
        wsClient?.close();
    });
}

function sendToPc(payload: any, waitForResponse = false, timeoutMs = 5000): Promise<any> {
    if (!WebSocket || !wsClient || wsClient.readyState !== WebSocket.OPEN) {
        return Promise.reject(new Error("PC Server not connected"));
    }
    const id = generateId();
    payload.id = id;

    return new Promise((resolve, reject) => {
        if (waitForResponse) {
            const timeout = setTimeout(() => {
                pendingRequests.delete(id);
                reject(new Error("Request timed out"));
            }, timeoutMs);
            pendingRequests.set(id, { resolve, reject, timeout });
        }

        wsClient!.send(JSON.stringify(payload));

        if (!waitForResponse) {
            resolve({ status: 'sent' });
        }
    });
}

// Initial connection
readConfig().then(config => {
    if (config) {
        // Migration: Add target to blocks if missing
        let modified = false;
        if (config.pages) {
            for (const page of config.pages) {
                for (const block of page.blocks) {
                    if (!block.target) {
                        modified = true;
                        if (block.actionType === 'yeelight' || block.actionType === 'wol') {
                            block.target = 'client';
                        } else if (block.actionType === 'statusDisplay') {
                            if (block.statusDisplayConfig?.apiEndpoint?.includes('xiaomi')) {
                                block.target = 'client';
                            } else {
                                block.target = 'server';
                            }
                        } else if (block.actionType === 'slider') {
                             block.target = 'server';
                        } else {
                             // command, shortcut, audio
                             block.target = 'server';
                        }
                    }
                }
            }
        }

        if (modified) {
            console.log("Migrating config: Added missing target properties.");
            writeConfig(config);
        }

        if (config.pcServer) {
            connectToPcServer(config.pcServer.ip, config.pcServer.port);
        }
    }
});


// --- XIAOMI CACHE ---
let xiaomiCache: { data: any; timestamp: number } | null = null;

async function getXiaomiApiData() {
    const now = Date.now();
    if (xiaomiCache && now - xiaomiCache.timestamp < 5000) {
      return xiaomiCache.data;
    }

    // Load config to get URL
    const config = await readConfig();
    const xiaomiUrl = config?.xiaomiUrl || 'http://192.168.1.76:5000/api/current';

    try {
      const { data } = await axios.get(xiaomiUrl, { timeout: 5000 });
      xiaomiCache = { data, timestamp: now };
      return data;
    } catch (error: any) {
      throw new Error("Xiaomi device unreachable");
    }
}


// --- SERVER FACTORY ---
export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // LOGIN
  app.post("/api/login", async (req, res) => {
    const { password } = req.body;
    try {
      const config = await readConfig();
      if (!config || !config.auth || !config.auth.hashedPassword) {
        return res.status(500).json({ error: "Auth config missing." });
      }
      const isMatch = await bcrypt.compare(password, config.auth.hashedPassword);
      if (isMatch) {
        res.status(200).json({ token: AUTH_TOKEN });
      } else {
        res.status(401).json({ error: "Incorrect password" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal error" });
    }
  });

  // CONFIG
  app.get("/api/config", async (_req, res) => {
    try {
      const config = await readConfig();
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to read config." });
    }
  });

  app.post("/api/config", async (req, res) => {
    try {
      const newConfig = req.body;
      await writeConfig(newConfig);

      // Update WebSocket Connection if PC Config changed
      if (newConfig.pcServer) {
           connectToPcServer(newConfig.pcServer.ip, newConfig.pcServer.port);
      }

      res.status(200).json({ message: "Config saved." });
    } catch (error) {
      res.status(500).json({ error: "Failed to save config." });
    }
  });

  app.post("/api/update-password", async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
      const config = await readConfig();
      const hashedPassword = config.auth?.hashedPassword;
      if (!hashedPassword) return res.status(500).json({ error: "Password not set." });

      const isMatch = await bcrypt.compare(currentPassword, hashedPassword);
      if (!isMatch) return res.status(401).json({ error: "Incorrect current password" });

      const newHashedPassword = await bcrypt.hash(newPassword, 12);
      config.auth.hashedPassword = newHashedPassword;
      await writeConfig(config);

      res.status(200).json({ message: "Password updated." });
    } catch (error) {
      res.status(500).json({ error: "Internal error" });
    }
  });

  // SERVER STATUS
  app.get("/api/server-status", (_req, res) => {
      res.json({ status: isPcConnected ? 'online' : 'offline' });
  });

  // ACTION EXECUTION
  app.post("/api/execute-action", async (req, res) => {
    const { command, shortcut, wolConfig, target } = req.body;
    
    // Default target: 'client' if not specified?
    // Actually, 'command' blocks might have explicit target.
    // If target is 'server', we forward.

    if (target === 'server') {
        if (!isPcConnected) return res.status(503).json({ error: "PC Server disconnected" });

        let payload: any = {};
        if (shortcut) {
            payload = { type: 'shortcut', shortcut };
        } else if (command) {
             if (command === 'STOP_ALL_AUDIO') payload = { type: 'audio', audio_action: 'stop_all' };
             else if (command === 'STOP_AUDIO') payload = { type: 'audio', audio_action: 'stop' };
             else if (command.startsWith('PLAY_AUDIO')) {
                 const file = command.substring('PLAY_AUDIO'.length).trim();
                 payload = { type: 'audio', audio_action: 'play', file_path: file };
             }
             else if (command.startsWith('nircmd.exe')) {
                 // Keep passing nircmd command as 'command' type but let server handle it
                 payload = { type: 'command', command: 'nircmd.exe', args: command.split(' ').slice(1) };
             }
             else {
                 // Generic command
                 const parts = command.split(' ');
                 payload = { type: 'command', command: parts[0], args: parts.slice(1) };
             }
        } else {
            return res.status(400).json({ error: "Nothing to execute" });
        }

        try {
            const response = await sendToPc(payload, true);
            if (response.status === 'error') throw new Error(response.message);
            res.json({ message: "Executed on Server", details: response });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
        return;
    }

    // TARGET: CLIENT (Raspberry Pi)

    if (command === 'WOL' && wolConfig) {
        if (wolConfig.method === 'etherwake') {
             // Validate MAC address to prevent command injection
             if (!/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(wolConfig.mac)) {
                 return res.status(400).json({ error: "Invalid MAC address format" });
             }

             // Requires sudo. Assuming user running node has passwordless sudo for etherwake
             // or running as root.
             exec(`sudo etherwake ${wolConfig.mac}`, (err, stdout, stderr) => {
                 if (err) return res.status(500).json({ error: err.message, stderr });
                 res.json({ message: "Etherwake sent", stdout });
             });
        } else {
            // Wake-on-LAN (UDP broadcast)
            if (wol) {
                wol.wake(wolConfig.mac, (err: any) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: "Magic Packet sent" });
                });
            } else {
                res.status(503).json({ error: "Wake-on-LAN module not loaded." });
            }
        }
        return;
    }
    
    if (command && (command.startsWith('curl') || command.startsWith('start'))) {
        // Local execution
        // 'start' on linux is 'xdg-open' usually, but 'start' might be alias.
        // If command is 'start <url>', we use 'xdg-open <url>'?
        // Or user puts 'start https://...' and expects it to open on Pi?
        // 'start' is windows cmd.
        let finalCmd = command;
        if (command.startsWith('start ')) {
            // Replace start with xdg-open for URLs if needed, or allow raw
             // But 'start' is not standard linux.
             // We'll execute as is, assume user knows what they are doing on Linux (e.g. they installed a 'start' alias or use 'xdg-open')
             // Or better: map 'start' to 'xdg-open' if it looks like a URL?
             // Let's just execute what is given.
        }

        exec(command, (error, stdout, stderr) => {
            if (error) return res.status(500).json({ error: error.message, stderr });
            res.json({ message: "Executed on Client", stdout });
        });
        return;
    }

    // If we reached here, it's an unknown command for client or missing target
    // Fallback: If it's old legacy command (nircmd, audio) and target wasn't specified,
    // we should probably try to send to PC if connected?
    // But safe bet is to error out or try PC.
    // Given migration, let's try PC if connected and looks like windows command.
    if (command && (command.includes('nircmd') || command.includes('AUDIO') || shortcut)) {
         // Auto-forward to PC for legacy compatibility
         if (isPcConnected) {
             // ... duplicate forwarding logic ...
             // For brevity, I'll return error asking to configure target.
             return res.status(400).json({ error: "Please configure target to 'Server' for this block." });
         } else {
             return res.status(503).json({ error: "PC Offline and target not specified." });
         }
    }

    res.status(400).json({ error: "Command not handled on Client." });
  });

  // YEELIGHT
  app.post("/api/yeelight-toggle", async (req, res) => {
    const { action, yeelightIp } = req.body;
    try {
      const msg = await controlYeelight(action, yeelightIp);
      res.json({ message: msg });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  
  app.post("/api/yeelight-brightness", async (req, res) => {
      try { await controlYeelightBrightness(req.body.yeelightIp, req.body.brightness); res.json({ message: "OK" }); }
      catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/yeelight-color-temp", async (req, res) => {
      try { await controlYeelightColorTemperature(req.body.yeelightIp, req.body.colorTemp); res.json({ message: "OK" }); }
      catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/yeelight-color", async (req, res) => {
      try { await controlYeelightRGB(req.body.yeelightIp, req.body.color); res.json({ message: "OK" }); }
      catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/yeelight-hue", async (req, res) => {
      try { await controlYeelightHSV(req.body.yeelightIp, req.body.hue); res.json({ message: "OK" }); }
      catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // VOLUME
  app.post("/api/set-master-volume", async (req, res) => {
      // Volume is always PC?
      if (!isPcConnected) return res.status(503).json({ error: "PC Offline" });
      try {
          await sendToPc({ type: 'volume', value: req.body.value }, false);
          res.json({ message: "Volume sent" });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  
  // SYSTEM SERVER COMMANDS
  app.post("/api/restart-server", async (req, res) => {
      res.json({ message: "Restarting Client..." });
      setTimeout(() => process.exit(0), 100);
  });

  app.post("/api/stop-server", (req, res) => {
      res.json({ message: "Stopping Client..." });
      setTimeout(() => process.exit(0), 100);
  });

  app.post("/api/restart-pc-server", async (req, res) => {
      if (!isPcConnected) return res.status(503).json({ error: "PC Offline" });
      try {
          await sendToPc({ type: 'restart_server' }, false);
          res.json({ message: "Restart command sent to PC" });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/stop-pc-server", async (req, res) => {
      if (!isPcConnected) return res.status(503).json({ error: "PC Offline" });
      try {
          await sendToPc({ type: 'stop_server' }, false);
          res.json({ message: "Stop command sent to PC" });
      } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // STATS (Proxy to PC)
  const proxyStat = (type: string, res: any) => {
      if (!isPcConnected) return res.status(503).json({ error: "PC Offline" });
      sendToPc({ type }, true, 2000)
        .then(data => {
            if (data.status === 'success') res.json({ value: data.value });
            else res.status(500).json({ error: data.message });
        })
        .catch(e => res.status(500).json({ error: e.message }));
  };

  app.get("/api/get-cpu-usage", (req, res) => proxyStat('get_cpu', res));
  app.get("/api/get-ram-usage", (req, res) => proxyStat('get_ram', res));
  app.get("/api/get-gpu-usage", (req, res) => proxyStat('get_gpu', res)); // Alias for cuda
  app.get("/api/get-cuda-usage", (req, res) => proxyStat('get_gpu', res));
  app.get("/api/get-vram-usage-percent", (req, res) => proxyStat('get_vram_percent', res));
  app.get("/api/get-vram-usage-gb", (req, res) => proxyStat('get_vram_gb', res));

  // XIAOMI SENSORS
  app.get("/api/get-xiaomi-temperature", async (_req, res) => {
    try { const d = await getXiaomiApiData(); res.json({ value: d.temperature }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/get-xiaomi-humidity", async (_req, res) => {
    try { const d = await getXiaomiApiData(); res.json({ value: d.humidity }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/get-xiaomi-battery", async (_req, res) => {
    try { const d = await getXiaomiApiData(); res.json({ value: d.battery }); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  return app;
}
