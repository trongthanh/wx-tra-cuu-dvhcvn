# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). Phiên bản đánh số theo `package.json`; `DATA_VERSION` (dữ liệu IndexedDB) được nâng cùng khi dữ liệu thay đổi.

## [1.2.0] - 2026-11-24

### Dữ liệu
- **Thành phố Quảng Ninh** trực thuộc Trung ương (hiệu lực 1/9/2026, Nghị quyết 36/2026/QH16) và **Thành phố Bắc Ninh** (hiệu lực 20/9/2026, Nghị quyết 39/2026/QH16): cập nhật tên và loại hình tỉnh, cùng tên tỉnh của 153 phường/xã thuộc hai địa phương.
- 12 xã của Bắc Ninh được thành lập phường trên cơ sở nguyên trạng (Nghị quyết 388/NQ-UBTVQH16, hiệu lực 20/9/2026): Bố Hạ, Chi Lăng, Gia Bình, Hiệp Hòa, Kép, Lạng Giang, Lục Nam, Lương Tài, Nhân Thắng, Phù Lãng, Tiên Du, Yên Phong.
- Đối chiếu toàn bộ ánh xạ cũ → mới với **Bảng chuyển đổi ĐVHC của Cục Thống kê** (danhmuchanhchinh.nso.gov.vn):
  - Ánh xạ tăng từ 10.035 lên **10.565 cặp**, bổ sung các trường hợp "nhập một phần" (một xã cũ được chia vào nhiều xã mới).
  - Sửa 5 ánh xạ sai mã xã cũ (Mỹ Hưng, Phú Thịnh, Thạnh Lộc, Đặng Xá…) và loại 2 đơn vị cũ mã sai.
  - Bổ sung **25 phường/xã mới** và **82 đơn vị cấp xã cũ** từng bị thiếu do tên chứa dấu nháy (Ea H'Leo, B'Lao, D'Ran, Ia Đal, Đạ M'ri, Ch'ơm…), nay đủ 3.316 phường/xã mới và 10.033 đơn vị cũ.

### Cải tiến
- Chú giải trên trang web không còn bỏ qua tên phường/xã nằm trong ngoặc đơn: trước đây phần trong ngoặc thường là tên cũ do tòa soạn chú thích, nay hầu như không còn và tên mới mới là trường hợp phổ biến.
- Tìm kiếm bỏ qua dấu nháy (`'`, `’`, `‘`, `ʼ`, `` ` ``): `B'Lao`, `B’Lao`, `Blao` đều khớp.
- Chú giải trên trang web nhận diện được tên phường/xã có dấu nháy (vd. "Phường B'Lao").

### Sửa
- Chú giải không còn khớp nhầm khi tên phường/xã được theo sau bởi từ thường trùng tên khi bỏ dấu, vd. "phường An Nhơn nằm" từng bị nhận thành "Phường An Nhơn Nam". Tên riêng viết hoa nay dừng ở từ viết thường đầu tiên.
- Tên phường/xã trùng nhau giữa nhiều tỉnh (244 tên, vd. "phường An Nhơn") trước đây không được chú giải nếu thiếu tỉnh trong ngoặc. Nay tự nhận tỉnh viết ngay sau tên ("…, TP.HCM", "tỉnh Gia Lai", kể cả tên tỉnh cũ như "Bình Định"); nếu vẫn chưa rõ, tooltip liệt kê tất cả các khả năng.

### Chưa hỗ trợ
- 5 đặc khu cấp huyện cũ (Lý Sơn, Côn Đảo, Hoàng Sa, Cồn Cỏ, Bạch Long Vĩ) chưa có trong dữ liệu vì không có đơn vị cấp xã cũ tương ứng.

## [1.1.0] - 2026-06-09

### Dữ liệu
- Tỉnh Đồng Nai trở thành **Thành phố Đồng Nai** trực thuộc Trung ương (hiệu lực 30/4/2026, Nghị quyết 30/2026/QH16).
- 10 xã chuyển thành phường (Nghị quyết 237/NQ-UBTVQH16): Dầu Giây, Long Thành, Lộc Ninh, Nhơn Trạch, Trảng Bom, Trị An, Tân Khai, Tân Phú, Xuân Lộc, Đồng Phú.

### Website
- Thêm mục FAQ "Dữ liệu được cập nhật đến khi nào?".

## [1.0.4] - 2026-03-29

### Thêm
- Phần tử (hoặc phần tử cha) có thuộc tính `data-no-dvhcvn` sẽ được bỏ qua khi chú giải tự động.

### Website (sau 1.0.4, chưa bump phiên bản tiện ích)
- Chạy offline dạng PWA (30/3).
- Thêm FAQ, footer ủng hộ, cải thiện Open Graph, sửa popup tìm kiếm bị cắt do overflow (3/4).
- Thêm liên kết cài đặt Microsoft Edge và cải thiện nút CTA cửa hàng tiện ích (15/4).

## [1.0.3] - 2026-03-27

### Thêm
- Chủ đề giao diện sáng / tối / tự động: nút chuyển trên website và mục cài đặt trong popup (lưu bằng `browser.storage.local`).

### Sửa
- Cải thiện khả năng truy cập (ARIA): `tablist`/`tab`/`tabpanel`, `combobox`, `listbox`/`option`, `aria-expanded`…
- Hợp nhất các quy tắc CSS chế độ tối.

## [1.0.2] - 2026-03-25

### Sửa
- Lỗi kích thước popup trên máy tính (regression).

## [1.0.1] - 2026-03-24

### Thêm
- Website (bản nháp) làm công cụ tra cứu trực tuyến và trang giới thiệu tiện ích; cấu hình triển khai Cloudflare Pages.

## [1.0.0] - 2026-03-15

Phát hành lần đầu trên Chrome Web Store và Firefox Add-ons.

### Tính năng
- Tra cứu **mới → cũ** và **cũ → mới** cho ~3.200 phường/xã (34 tỉnh/thành phố sau sáp nhập 2025), lưu cục bộ bằng IndexedDB, hoạt động offline.
- Ô tìm kiếm nhanh không dấu, hỗ trợ tìm theo cụm (`phường, tỉnh` hoặc `phường, quận, tỉnh`).
- Hiển thị ánh xạ cấp tỉnh ngay khi chọn tỉnh, trước khi chọn phường/xã.
- **Chú giải trên trang web:** nhận diện tên phường/xã mới, gạch chân kèm biểu tượng `[?]` và tooltip hiển thị quận/huyện, tỉnh cũ; huy hiệu đếm số đơn vị được chú giải trên trang.
- Trang cài đặt và giới thiệu trong popup.

### Sửa (trong giai đoạn phát hành đầu)
- Lỗi `Extension context invalidated` sau khi cập nhật/tải lại tiện ích.
- Tương thích Firefox MV2 (`setBadge`) và Firefox Android: popup co giãn theo màn hình, tooltip luôn nằm trong khung nhìn, ẩn khi cuộn, chạm để ghim/đóng.
- Loại bỏ `console.log` ở bản production.

## Tiền phát hành (2025-09 → 2026-03)
- Khởi tạo dự án WXT, lược đồ IndexedDB và dữ liệu tỉnh/phường cũ–mới (9/2025).
- Kiểm thử đơn vị với Vitest và fake-indexeddb (3/2026).
