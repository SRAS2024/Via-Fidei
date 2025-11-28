// vite.config.js
// Via Fidei · Vite config for React client in /client

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname for ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Vite project root is the /client folder
  root: path.resolve(__dirname, "client"),

  // Important: tell the React plugin to process .js files as JSX too
  plugins: [
    react({
      jsxRuntime: "automatic",
      include: [
        "**/*.js",
        "**/*.jsx",
        "**/*.ts",
        "**/*.tsx"
      ]
    })
  ],

  resolve: {
    alias: {
      // You can use "@/..." to refer to files inside client/src
      "@": path.resolve(__dirname, "client", "src")
    }
  },

  server: {
    port: 5173,
    strictPort: true
  },

  build: {
    // Output folder relative to the Vite root (client/)
    // So final path on disk is /client/dist
    outDir: "dist",
    emptyOutDir: true
  }
});
