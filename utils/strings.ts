/**
 * Normalize a string by removing diacritics and converting to lowercase.
 */
export function normalizeStr(str: string): string {
  // chuyển về dạng tổ hợp
  let normalized = str.normalize('NFD');
  // xóa các ký tự dấu tổ hợp
  normalized = normalized.replace(/[\u0300-\u036f]/g, '');
  // chuyển chữ đ/Đ thành d/D
  normalized = normalized.replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'));
  // chuyển về chữ thường
  return normalized.toLowerCase();
}

