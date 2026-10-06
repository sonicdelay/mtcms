import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const API_TARGET = process.env.API_TARGET ?? "http://localhost:4000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 4210,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:8421",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 1600,
  },
  resolve: {
    alias: {
      "@components": fileURLToPath(
        new URL("./app/components", import.meta.url),
      ),
    },
    dedupe: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
      "zustand",
      "zustand/shallow",
      "zustand/middleware",
    ],
  },
  optimizeDeps: {
    include: ["react/jsx-runtime"],
  },
});
