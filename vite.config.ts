import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const envPairs = Object.entries(process.env);
  const reactAppEnvObject = envPairs.reduce<Record<string, string>>((acc, [key, value]) => {
    if (key.startsWith("REACT_APP_") || key.startsWith("VITE_")) {
      acc[key] = String(value ?? "");
    }
    return acc;
  }, {});
  reactAppEnvObject.NODE_ENV = mode;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        buffer: "buffer",
      },
    },
    define: {
      "process.env": JSON.stringify(reactAppEnvObject),
    },
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
