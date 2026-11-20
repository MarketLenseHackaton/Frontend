import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev proxy forwards /api/* to the FastAPI backend, so the browser never
// hits a CORS problem in development. Set VITE_API_URL=/api to use it,
// or VITE_API_URL=http://localhost:8000/api to call the backend directly.
const proxy = {
  "/api": {
    target: process.env.BACKEND_URL || "http://localhost:8000",
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
        },
      },
    },
  },
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
});
