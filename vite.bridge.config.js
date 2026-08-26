import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // React's browser bundle must not reference Node's `process` global.
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
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
