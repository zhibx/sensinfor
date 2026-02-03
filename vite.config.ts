import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: './public/manifest.json',
      watchFilePaths: ['src/**/*'],
      browser: 'chrome',
      disableAutoLaunch: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/detectors': path.resolve(__dirname, './src/detectors'),
      '@/analyzers': path.resolve(__dirname, './src/analyzers'),
      '@/storage': path.resolve(__dirname, './src/storage'),
      '@/config': path.resolve(__dirname, './src/config'),
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
