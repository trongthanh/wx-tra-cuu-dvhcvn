import { defineConfig } from 'wxt';
import pkg from './package.json';

// See https://wxt.dev/api/config.html
export default defineConfig({
  publicDir: 'public',
  manifest: ({ browser }) => ({
    name: 'Tra cứu Đơn Vị Hành Chính',
    description:
      'Tra cứu ĐVHC sau sáp nhập 2025. Tìm phường/xã mới theo tên cũ và ngược lại. Chú giải phường/xã mới trực tiếp trên trang web.',
    version: pkg.version,
    permissions: ['storage', 'activeTab'],
    ...(browser === 'firefox'
      ? {
          developer: { name: 'Thanh Tran', url: 'https://thanh.im' },
          browser_specific_settings: {
            gecko: {
              id: 'tra-cuu-dvhcvn@thanh.im',
              data_collection_permissions: {
                required: ['none'],
                optional: [],
              },
            },
          },
        }
      : { author: { email: 'trongthanh@gmail.com' } }),
    homepage_url: 'https://github.com/trongthanh/wx-tra-cuu-dvhcvn.git',
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '96': 'icon/96.png',
      '128': 'icon/128.png',
    },
    action: {
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '96': 'icon/96.png',
        '128': 'icon/128.png',
      },
      default_title: 'Tra cứu Đơn Vị Hành Chính',
    },
    web_accessible_resources: [
      {
        resources: ['data/*.csv'],
        matches: ['<all_urls>'],
      },
    ],
  }),
  // Explicitly include content scripts
  modules: [],
  vite: () => ({
    esbuild: {
      drop: ['console', 'debugger'],
    },
  }),
});
