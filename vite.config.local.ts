import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Local development configuration without Replit-specific dependencies
// Use this config if you want to run without Replit plugins:
// npx vite --config vite.config.local.ts

export default defineConfig(async () => {
  const plugins: PluginOption[] = ([] as PluginOption[]).concat(react());
  
  // Optional Replit plugins - safely loaded only if available (development only)
  if (process.env.NODE_ENV !== "production") {
    // Try to load runtime error modal if available
    try {
      const { default: runtimeErrorOverlay } = await import("@replit/vite-plugin-runtime-error-modal");
      const plugin = runtimeErrorOverlay();
      plugins.push(...(Array.isArray(plugin) ? plugin : [plugin]));
    } catch {
      console.info("@replit/vite-plugin-runtime-error-modal not available - using Vite's built-in error overlay");
    }
    
    // Try to load cartographer if in Replit environment
    if (process.env.REPL_ID) {
      try {
        const { cartographer } = await import("@replit/vite-plugin-cartographer");
        const plugin = cartographer();
        plugins.push(...(Array.isArray(plugin) ? plugin : [plugin]));
      } catch {
        console.info("@replit/vite-plugin-cartographer not available");
      }
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
  };
});