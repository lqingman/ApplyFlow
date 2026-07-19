import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { resolve } from "node:path";

function wrapContentScript(): Plugin {
  return {
    name: "wrap-content-script",
    renderChunk(code, chunk) {
      if (chunk.name !== "content") return null;
      return { code: `(() => {\n${code}\n})();`, map: null };
    },
  };
}

export default defineConfig({
  plugins: [react(), wrapContentScript()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        panel: resolve(__dirname, "index.html"),
        content: resolve(__dirname, "src/content.ts"),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "content" ? "content.js" : "assets/[name]-[hash].js",
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
  },
});
