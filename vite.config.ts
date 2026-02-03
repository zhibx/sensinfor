import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest-and-fix-html',
      closeBundle() {
        // 复制 manifest.json 到 dist 目录
        copyFileSync('public/manifest.json', 'dist/manifest.json');

        // 复制图标
        try {
          mkdirSync('dist/icons', { recursive: true });
          copyFileSync('public/icons/icon16.svg', 'dist/icons/icon16.svg');
          copyFileSync('public/icons/icon48.svg', 'dist/icons/icon48.svg');
          copyFileSync('public/icons/icon128.svg', 'dist/icons/icon128.svg');
        } catch (e) {
          console.log('Icons copy skipped or failed');
        }

        // 移动 popup.html 到根目录并修复路径
        const htmlSrc = 'dist/src/popup/index.html';
        const htmlDest = 'dist/popup.html';
        if (existsSync(htmlSrc)) {
          let html = readFileSync(htmlSrc, 'utf-8');
          // 修复资源路径
          html = html.replace(/src="\/popup\.js"/g, 'src="./popup.js"');
          html = html.replace(/href="\/chunks\//g, 'href="./chunks/');
          html = html.replace(/href="\/assets\//g, 'href="./assets/');
          writeFileSync(htmlDest, html);
          console.log('popup.html moved and paths fixed');
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/types': resolve(__dirname, './src/types'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/detectors': resolve(__dirname, './src/detectors'),
      '@/analyzers': resolve(__dirname, './src/analyzers'),
      '@/storage': resolve(__dirname, './src/storage'),
      '@/config': resolve(__dirname, './src/config'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'content') return 'content.js';
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (name.includes('index') && name.endsWith('.css')) return 'assets/popup.css';
          return 'assets/[name][extname]';
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
