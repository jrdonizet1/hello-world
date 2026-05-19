import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    ssr: {
      noExternal: [
        'react',
        'react-dom',
        'framer-motion',
        'lucide-react',
        '@tanstack/react-start',
        'h3-v2'
      ]
    }
  }
});
