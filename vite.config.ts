import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import mdx from '@mdx-js/rollup';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    mdx({ providerImportSource: '@mdx-js/react' }),
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,mdx,json}'],
        maximumFileSizeToCacheInBytes: 10000000,
      },
      manifest: {
        name: 'Piramid',
        short_name: 'Piramid',
        theme_color: '#0d0b09',
        background_color: '#0d0b09',
        display: 'standalone',
        icons: [
          {
            src: '/favicon-16x16.png',
            sizes: '16x16',
            type: 'image/png',
          },
          {
            src: '/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
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
            if (
              id.includes('vaul') ||
              id.includes('@radix-ui') ||
              id.includes('sonner')
            ) {
              return 'vendor-ui';
            }
          }
        },
      },
    },
  },
});
