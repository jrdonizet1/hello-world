import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    ssr: {
      noExternal: true,
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
  }
});
