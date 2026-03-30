import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';
import { existsSync, statSync, createReadStream, readdirSync, copyFileSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';

// Serve website/public/ as an additional static dir alongside the main publicDir.
// Vite only supports one publicDir, so this plugin handles dev serving and build copying.
function websitePublicPlugin(dir: string): Plugin {
  const MIME: Record<string, string> = {
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
  };

  function copyDir(src: string, dest: string) {
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);
      if (statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
      }
    }
  }

  return {
    name: 'website-public',
    // Serve files from website/public/ in dev
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '/').split('?')[0];
        const file = join(dir, url);
        if (existsSync(file) && statSync(file).isFile()) {
          res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          createReadStream(file).pipe(res as any);
          return;
        }
        next();
      });
    },
    // Copy website/public/ into dist/ after build
    closeBundle() {
      copyDir(dir, resolve(__dirname, 'dist'));
    },
  };
}

export default defineConfig({
  root: __dirname,
  publicDir: resolve(__dirname, '../public'),
  plugins: [
    websitePublicPlugin(resolve(__dirname, 'public')),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Pre-cache app shell: HTML, compiled JS/CSS, icons, SVGs
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Cache CSV data files at runtime (CacheFirst) — large files only needed
        // to populate IndexedDB on first visit; after that IndexedDB persists offline.
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.csv$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'csv-data',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Tra cứu Đơn Vị Hành Chính Việt Nam',
        short_name: 'Tra cứu ĐVHC',
        description:
          'Tra cứu đơn vị hành chính Việt Nam sau sáp nhập 2025. Hoạt động offline sau lần đầu tải.',
        theme_color: '#1d4ed8',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        lang: 'vi',
        icons: [
          { src: '/icon/48.png', sizes: '48x48', type: 'image/png' },
          { src: '/icon/96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icon/192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon/512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
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
