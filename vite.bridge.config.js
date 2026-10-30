import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // React's browser bundle must not reference Node's `process` global.
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    manifest: true,
    emptyOutDir: true,
    outDir: "assets/react",
    lib: {
      entry: "src/react/main.jsx",
      formats: ["es"],
      fileName: () => "navigation.js",
    },
  },
});
