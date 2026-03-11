import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  publicDir: 'public',
  manifest: {
    name: 'Tra cứu Đơn Vị Hành Chính',
    description:
      'Tra cứu và hiển thị thông tin đơn vị hành chính Việt Nam sau năm 2025. Tìm kiếm phường/xã mới theo tên cũ và ngược lại. Hiển thị gợi ý thông tin phường mới trực tiếp trên trang web.',
    version: '1.0.0',
    permissions: ['storage', 'activeTab'],
    author: {
      email: 'trongthanh@gmail.com',
    },
    homepage_url: 'https://github.com/trongthanh/wx-thong-tin-dvhcvn.git',
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
  },
  // Explicitly include content scripts
  modules: [],
});
