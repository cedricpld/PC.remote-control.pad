import { defineConfig } from "vite";
import path from "path";

// Server build configuration
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/node-build.ts"),
      name: "server",
      fileName: "production", // On force le nom du fichier
      formats: ["cjs"],
    },
    outDir: "dist/server",
    target: "node18",
    ssr: true,
    rollupOptions: {
      external: [
        "express", "cors", "fs", "path", "url", "http", "https", "os", 
        "crypto", "stream", "util", "events", "buffer", "querystring", "child_process"
      ],
      output: {
        format: "cjs",
        entryFileNames: "[name].cjs",
      },
    },
    minify: false,
    sourcemap: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});