# Web Extension Tra Cứu Đơn Vị Hành Chính Việt Nam

![GitHub package.json version](https://img.shields.io/github/package-json/v/trongthanh/wx-tra-cuu-dvhcvn)
 [![license | ISC](https://img.shields.io/badge/License-ISC-7c3aed)](https://github.com/trongthanh/wx-tra-cuu-dvhcvn/blob/main/LICENSE)


Browser extension giúp tra cứu tên các đơn vị hành chính mới và cũ của Việt Nam sau sáp nhập và tổ chức lại các đơn vị hành chính năm 2025.

Đã có tại:

[![Available in the Chrome Web Store](assets/chrome-web-store.svg)](https://chromewebstore.google.com/detail/kandeagnnilmlpbdlkadajdiempibkdd?utm_source=item-share-cb)  [![Available in the Mozilla Add-ons Store](assets/mozilla-add-ons.svg)](https://addons.mozilla.org/en-US/firefox/addon/tra-cuu-dvhcvn/)


## Bối cảnh:

Theo Hiến pháp và [Nghị quyết số 203/2025/QH15](https://xaydungchinhsach.chinhphu.vn/nghi-quyet-203-2025-qh15-sua-doi-bo-sung-mot-so-dieu-cua-hien-phap-nuoc-cong-hoa-xa-hoi-chu-nghia-viet-nam-119250616181735552.htm) sửa đổi, bổ sung của Quốc Hội nước Cộng hòa xã hội chủ nghĩa Việt Nam, [hệ thống phân cấp hành chính của Việt Nam](https://vi.wikipedia.org/wiki/Ph%C3%A2n_c%E1%BA%A5p_h%C3%A0nh_ch%C3%ADnh_Vi%E1%BB%87t_Nam) đã trải qua một đợt tái cấu trúc lớn vào năm 2025:

- **Hệ thống phân cấp hai cấp**: Cấp trung gian "Quận/Huyện" đã được bãi bỏ. Việt Nam hiện tại bao gồm **Tỉnh/Thành phố trực thuộc Trung ương** và **Phường/Xã/Thị trấn**.
- **Hợp nhất**: Số lượng tỉnh thành giảm từ 63 xuống còn 34 thông qua việc sáp nhập.
- **Sáp nhập Phường/Xã**: Các phường/xã nhỏ hoặc liền kề được sáp nhập thành các đơn vị lớn hơn, thường có tên gọi hoàn toàn mới không liên quan đến tên cũ (đặc biệt là các phường có tên bằng số).

Tiện ích này giúp người dùng dễ dàng chuyển đổi và thích nghi bằng cách kết nối thông tin giữa địa chỉ cũ và hệ thống mới.

## Giới thiệu

Điểm đặc biệt của **Web extension Tra Cứu ĐVHCVN** so với các trang web tra cứu ĐVHC sau sáp nhập hiện tại đó là nó hoạt động hoàn toàn offline.

Dữ liệu đơn vị hành chính cũ và mới đã được đóng gói kèm theo extension này và được đánh chỉ mục (indexing) ngay tại cơ sở dữ liệu cục bộ cho phép truy vấn tên phường/xã, quận/huyện, tỉnh/thành tức thời.

### Các tính năng hiện tại:

- **Mới → Cũ**: Tra cứu thông tin phường, quận và tỉnh cũ từ tên một phường mới.
- **Cũ → Mới**: Tìm kiếm phường và tỉnh mới tương ứng với các đơn vị hành chính cũ.
- **⚡ Tìm kiếm Nhanh**: Thanh tìm kiếm hợp nhất, hỗ trợ:
    - **Tìm kiếm theo cụm**: Có thể tìm theo `phường, tỉnh` hoặc `phường, quận, tỉnh`.
    - **Bỏ qua tiền tố**: Chỉ cần gõ `An Hội Tây, HCM` thay vì `Phường An Hội Tây, Thành phố Hồ Chí Minh`.
    - **Không cần dấu**: Hỗ trợ tìm kiếm không dấu (ví dụ: `tan binh` sẽ khớp với `Tân Bình`).
- **🔍 Chú thích Nội dung**: Tự động quét các trang web để tìm tên phường mới và:
    - Thêm gạch chân dấu chấm và biểu tượng gợi ý `[?]`.
    - **Khớp thông minh**: Sử dụng logic dự phòng để xử lý các văn bản phức tạp và phân biệt các phường trùng tên dựa trên gợi ý tỉnh trong ngoặc đơn (ví dụ: `Phường Bảy Hiền (TP.HCM)`).
    - **Tooltip**: Di chuột để xem thông tin quận và tỉnh cũ đã hình thành nên phường mới này.
    - **Số lượng phát hiện**: Hiển thị số lượng phường được tìm thấy ngay trên biểu tượng của tiện ích.
- **⚙️ Cài đặt**: Dễ dàng bật/tắt tính năng chú thích nội dung.

## Công nghệ Sử dụng

- **IndexedDB**: Lưu trữ dữ liệu cục bộ bằng thư viện [idb](https://github.com/nicolo-ribaudo/idb), kết hợp với các chỉ mục (index) đã chuẩn hóa để tìm fuzzy search cực nhanh.
- **Choices.js**: Cải thiện trải nghiệm chọn (select) và tìm kiếm trong giao diện popup.
- [WXT](https://wxt.dev/) (Web eXTension Toolkit) — Manifest V3 (Chrome) / V2 (Firefox).
- **Vitest**: Kiểm thử đơn vị (unit test) toàn diện với `fake-indexeddb`.

## Getting start with development

```bash
# Install dependencies
pnpm install

# Start dev server (Chrome)
pnpm dev

# Start dev server (Firefox)
pnpm dev:firefox
```

## Build

```bash
# Build for Chrome
pnpm build

# Build for Firefox
pnpm build:firefox

# Create distributable zip
pnpm zip          # Chrome
pnpm zip:firefox  # Firefox
```

## Testing

```bash
pnpm test         # Single run
pnpm test:watch   # Watch mode
```

## Website (Landing Page)

The `website/` directory contains a standalone landing page built with Vite, deployed to **Cloudflare Pages** (configured via `wrangler.toml`).

```bash
# Dev server (accessible on local network)
pnpm website:dev

# Production build → website/dist/
pnpm website:build

# Preview production build
pnpm website:preview
```

The website reuses `utils/` and `public/data/` from the extension and includes a live lookup widget and an interactive annotation demo.

## Project Structure

```
entrypoints/                    # Extension entry points
├── background.ts               # Data initialization on install/update
├── ward-annotation.content.ts  # Content script for page annotation
└── popup/                      # Browser action popup UI
    ├── index.html
    ├── main.ts
    └── style.css

utils/                    # Core utilities
├── indexeddb.ts          # IndexedDB schema and queries
├── ward-lookup.ts        # Ward lookup service layer
├── data-setup.ts         # CSV loading and DB population
├── csv-parser.ts         # CSV parsing
├── strings.ts            # Vietnamese diacritic normalization
└── settings.ts           # Extension settings management

public/
├── *               # Static assets bundled with the extension
└── data/           # Administrative unit CSV data
    └── *.csv       # (CSV format is more compact than JSON)

website/                  # Landing page (deployed to GitHub Pages)
├── index.html
├── vite.config.ts
├── public/           # Website-only static assets (SVG store badges)
└── src/
    ├── main.ts
    ├── style.css
    ├── lookup-widget.ts
    └── web-data-setup.ts

tests/                # Unit tests
```

---

©️ 2026 Thanh Trần. ISC License.
