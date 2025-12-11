import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { pathToFileURL } from "url";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3467,
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async configureServer(server) {
      try {
        // Resolve absolute path to server index and use file:// protocol for Windows compatibility
        const serverPath = path.resolve(process.cwd(), "./server/index.ts");
        const serverUrl = pathToFileURL(serverPath).href;

        const { createServer } = await import(serverUrl);
        const app = createServer();

        // Add Express app as middleware to Vite dev server
        server.middlewares.use(app);
      } catch (e) {
        console.error("Failed to load server middleware:", e);
      }
    },
  };
}
