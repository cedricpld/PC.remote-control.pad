import path from "path";
import os from "os";
import { createServer } from "./index";
import express from "express";
import { fileURLToPath } from "url";

const app = createServer();
const port = process.env.PORT || 3467;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../spa");

// Serve static files
app.use(express.static(distPath));

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return next();
  }
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  
  // --- DÉBUT DE LA CORRECTION ---
  const interfaces = os.networkInterfaces();
  let localIp = null;
  const candidates: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        candidates.push(net.address);
      }
    }
  }

  // On cherche en priorité une adresse IP de réseau local typique
  localIp = candidates.find(ip => ip.startsWith('192.168.')) || null;

  // Si on n'en trouve pas, on prend la première disponible comme solution de secours
  if (!localIp && candidates.length > 0) {
    localIp = candidates[0];
  }
  // --- FIN DE LA CORRECTION ---

  console.log(`📱 Frontend: http://localhost:${port}`);
  if (localIp) {
    console.log(`   Sur votre réseau : http://${localIp}:${port}`);
  }
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});