import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false,
    outDir: "assets/react",
    lib: {
      entry: "src/react/main.jsx",
      formats: ["iife"],
      name: "BrotherBibleReact",
      fileName: () => "navigation.js",
    },
  },
});
