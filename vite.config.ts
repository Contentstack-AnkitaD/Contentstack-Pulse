import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Build individual define entries for each REACT_APP_* env var
  const defines: Record<string, string> = {
    "process.env.NODE_ENV": JSON.stringify(mode),
  };
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("REACT_APP_") || key.startsWith("VITE_")) {
      defines[`process.env.${key}`] = JSON.stringify(value ?? "");
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        buffer: "buffer",
      },
    },
    define: defines,
    envPrefix: ["VITE_", "REACT_APP_"],
    optimizeDeps: {
      include: ["buffer"],
    },
    build: {
      target: "es2020",
      outDir: "build",
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      open: true,
    },
  };
});
