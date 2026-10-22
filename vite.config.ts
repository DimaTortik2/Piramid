import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import mdx from '@mdx-js/rollup';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    mdx({ providerImportSource: '@mdx-js/react' }),
    tailwindcss(),
    react(),
    visualizer({ open: true, filename: 'stats.html', gzipSize: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
    build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('matter-js')) {
              return 'vendor-matter';
            }
            if (id.includes('@phosphor-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-framework';
            }
            if (id.includes('vaul') || id.includes('@radix-ui') || id.includes('sonner')) {
              return 'vendor-ui';
            }
          }
        },
      },
    },
  },
});
