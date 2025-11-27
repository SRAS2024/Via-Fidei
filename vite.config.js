// vite.config.js
// Via Fidei · Vite config for React client in /client

const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const path = require("path");

module.exports = defineConfig({
  // Vite project root is the /client folder
  root: path.resolve(__dirname, "client"),
  plugins: [react()],
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
