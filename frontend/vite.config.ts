import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoBase = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  plugins: [react()],
  base: repoBase,
  server: {
    port: 5173
  }
});
