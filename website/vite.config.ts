import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: __dirname,
  publicDir: resolve(__dirname, '../public'),
  plugins: [],
  resolve: {
    alias: {
      '@': resolve(__dirname, '..'),
    },
  },
  css: {
    devSourcemap: true,
  },
  server: {
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
