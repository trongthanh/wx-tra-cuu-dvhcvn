import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  publicDir: 'public',
  manifest: {
    permissions: ['storage'],
    web_accessible_resources: [
      {
        resources: ['data/*.csv'],
        matches: ['<all_urls>']
      }
    ]
  },
  // Explicitly include content scripts
  modules: [],
});
