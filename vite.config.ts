import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import mdx from '@mdx-js/rollup';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    mdx({ providerImportSource: '@mdx-js/react' }),
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
