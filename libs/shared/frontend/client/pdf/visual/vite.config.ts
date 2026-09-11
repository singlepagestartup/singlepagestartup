import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  server: { host: "127.0.0.1", port: 4330, strictPort: true },
});
