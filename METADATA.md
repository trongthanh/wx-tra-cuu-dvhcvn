# Chrome Web Store Listing

## Mô tả ngắn (Short description)

Tra cứu ĐVHC sau sáp nhập 2025. Tìm phường/xã mới theo tên cũ và ngược lại. Chú giải phường/xã mới trực tiếp trên trang web.

## Mô tả chi tiết (Detailed description)

Bạn đang bối rối với tên phường, xã, tỉnh mới sau đợt sáp nhập đơn vị hành chính 2025?

Từ tháng 6/2025, Việt Nam chuyển từ hệ thống 3 cấp (tỉnh → quận/huyện → phường/xã) sang 2 cấp (tỉnh/thành → phường/xã), với 63 tỉnh thành sáp nhập còn 34 và hàng nghìn phường xã được gộp lại với tên gọi hoàn toàn mới. Tiện ích này giúp bạn nhanh chóng tra cứu và làm quen với hệ thống mới.

🔎 TRA CỨU MỚI → CŨ
Chọn tỉnh và phường mới để xem phường, quận, tỉnh cũ tương ứng. Hữu ích khi đọc báo hoặc văn bản nhắc đến địa danh mới mà bạn chưa quen.

🔎 TRA CỨU CŨ → MỚI
Chọn tỉnh, quận, phường cũ để tìm phường và tỉnh mới. Tiện lợi khi cần cập nhật địa chỉ cũ sang hệ thống mới.

⚡ TÌM KIẾM NHANH
- Tìm theo cụm: "An Hội Tây, HCM" hoặc "An Hội Tây, Gò Vấp, HCM"
- Không cần gõ đầy đủ: bỏ qua tiền tố Phường/Xã/Thành phố
- Hỗ trợ tìm không dấu: gõ "tan binh" sẽ khớp "Tân Bình"

📝 CHÚ GIẢI TRÊN TRANG WEB
Tự động nhận diện tên phường/xã mới trên các trang web bạn đang đọc. Khi phát hiện, tiện ích sẽ thêm gạch chân và biểu tượng [?]. Di chuột vào để xem ngay thông tin quận, phường, tỉnh cũ — không cần rời trang.

✅ Dữ liệu tra cứu được lưu cục bộ, hoạt động nhanh và không cần kết nối mạng sau khi cài đặt.
✅ Hoàn toàn miễn phí, mã nguồn mở.
✅ Dữ liệu cập nhật thường xuyên theo các thay đổi hành chính mới nhất, bao gồm việc nâng cấp tỉnh Đồng Nai thành Thành phố Đồng Nai trực thuộc Trung ương (hiệu lực từ 30/4/2026).

## Release Notes

### v1.1.0

Cập nhật dữ liệu: Tỉnh Đồng Nai chính thức trở thành Thành phố Đồng Nai trực thuộc Trung ương kể từ ngày 30/4/2026 (Nghị quyết số 30/2026/QH16). Phiên bản này cập nhật toàn bộ dữ liệu phường/xã thuộc Đồng Nai, bao gồm 10 đơn vị được nâng cấp từ xã lên phường: Dầu Giây, Long Thành, Lộc Ninh, Nhơn Trạch, Trảng Bom, Trị An, Tân Khai, Tân Phú, Xuân Lộc, Đồng Phú.

## Privacy Declaration

### Single purpose

This extension helps users look up and understand Vietnam's new administrative unit names (wards and provinces) after the 2025 administrative reform, by providing an in-page lookup popup and automatic annotations on web page content.

### Permission justifications

**storage:**

The extension uses the `storage` permission to save user settings (e.g., whether content annotation is enabled) and to cache Vietnamese administrative unit data locally via IndexedDB. This avoids re-fetching the dataset on every page load and ensures the extension works offline after the first initialization.

**activeTab:**

The extension uses the `activeTab` permission to send messages to the content script running on the current active tab when the user changes settings in the popup (e.g., toggling the ward annotation feature on or off). This allows settings changes to take effect immediately on the current page without requiring a reload.

**Host permission (`<all_urls>`):**

The extension injects a content script into all pages to scan psge text for new Vietnamese ward and commune names and annotate them with their corresponding old district and province context. Because Vietnamese administrative unit names can appear on any website — news sites, government portals, maps, social media — broad host access is required to provide this annotation feature wherever users browse.
