import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  build: {
    lib: {
      entry: "src/index.tsx",
      name: "SalesWidget",
      formats: ["iife"],
      fileName: () => "widget.js",
    },
    rollupOptions: {
      external: [],
      output: {
        // Inline CSS into JS (injected into Shadow DOM)
        assetFileNames: "[name][extname]",
      },
    },
    // Produce a single file
    cssCodeSplit: false,
    minify: true,
    outDir: "dist",
  },
});
