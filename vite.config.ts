import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  resolve: {
    alias: {
      "h3-v2": "h3",
    },
  },
  ssr: {
    noExternal: ["h3"],
  },
});


