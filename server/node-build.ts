import path from "path";
import { createServer } from "./index";
import express from "express";

const app = createServer();
const port = process.env.PORT || 3467;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Serve static files
app.use(express.static(distPath));

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api/")) {
    res.sendFile(path.join(distPath, "index.html"));
  } else {
    res.status(404).json({ error: "API endpoint not found" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
});