import { describe, it, expect } from 'vitest';
import { normalizeStr } from '../utils/normalizeStr';

describe('normalizeStr', () => {
  it('lowercases ASCII strings', () => {
    expect(normalizeStr('Hello World')).toBe('hello world');
  });

  it('removes Vietnamese diacritics', () => {
    expect(normalizeStr('Phường')).toBe('phuong');
    expect(normalizeStr('Quận')).toBe('quan');
    expect(normalizeStr('Tỉnh')).toBe('tinh');
  });

  it('converts đ to d and Đ to D (then lowercases)', () => {
    expect(normalizeStr('đường')).toBe('duong');
    expect(normalizeStr('Đà Nẵng')).toBe('da nang');
  });

  it('handles common Vietnamese province/ward names', () => {
    expect(normalizeStr('Thành phố Hồ Chí Minh')).toBe('thanh pho ho chi minh');
    expect(normalizeStr('Hà Nội')).toBe('ha noi');
    expect(normalizeStr('Đà Lạt')).toBe('da lat');
    expect(normalizeStr('Phú Quốc')).toBe('phu quoc');
  });

  it('preserves spaces and numbers', () => {
    expect(normalizeStr('Phường 12')).toBe('phuong 12');
    expect(normalizeStr('Quận 1')).toBe('quan 1');
  });

  it('handles already-normalized strings', () => {
    expect(normalizeStr('phuong')).toBe('phuong');
    expect(normalizeStr('ha noi')).toBe('ha noi');
  });

  it('handles empty string', () => {
    expect(normalizeStr('')).toBe('');
  });
});
