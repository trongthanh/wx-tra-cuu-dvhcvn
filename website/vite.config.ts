import { defineConfig } from 'vite';
import { resolve } from 'path';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig({
  root: __dirname,
  publicDir: resolve(__dirname, '../public'),
  plugins: [devtoolsJson()],
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
