import { describe, it, expect } from 'vitest';
import {
  trimToProperNouns,
  provinceHintCandidates,
  stripProvinceType,
  provinceAliasKeys,
} from '../utils/ward-text';

describe('trimToProperNouns', () => {
  it('cuts trailing lowercase words after a capitalized name', () => {
    expect(trimToProperNouns(['An', 'Nhơn', 'nằm', 'ở'])).toEqual(['An', 'Nhơn']);
    expect(trimToProperNouns(['An', 'Nhơn', 'tỉnh', 'Gia', 'Lai'])).toEqual(['An', 'Nhơn']);
  });

  it('keeps multi-word capitalized names and numbers', () => {
    expect(trimToProperNouns(['Văn', 'Miếu', '-', 'Quốc', 'Tử', 'Giám'])).toHaveLength(6);
    expect(trimToProperNouns(['12', 'là'])).toEqual(['12']);
    expect(trimToProperNouns(['Cư', 'M’gar'])).toEqual(['Cư', 'M’gar']);
  });

  it('keeps everything when the text is all lowercase', () => {
    expect(trimToProperNouns(['an', 'nhơn', 'nam'])).toEqual(['an', 'nhơn', 'nam']);
  });
});

describe('provinceHintCandidates', () => {
  it('reads a province after a comma', () => {
    expect(provinceHintCandidates(', TP.HCM đã')[0]).toBe('TP.HCM đã');
    expect(provinceHintCandidates(', TP.HCM đã')).toContain('TP.HCM');
  });

  it('skips type words and connectors', () => {
    expect(provinceHintCandidates(' tỉnh Gia Lai')).toContain('Gia Lai');
    expect(provinceHintCandidates(', thuộc thành phố Hồ Chí Minh')).toContain('Hồ Chí Minh');
    expect(provinceHintCandidates(' Gia Lai là')).toContain('Gia Lai');
  });

  it('does not cross a sentence boundary', () => {
    expect(provinceHintCandidates('. Gia Lai')).toEqual([]);
    expect(provinceHintCandidates('')).toEqual([]);
  });
});

describe('province helpers', () => {
  it('strips province type prefixes', () => {
    expect(stripProvinceType('Thành phố Hồ Chí Minh')).toBe('ho chi minh');
    expect(stripProvinceType('Tỉnh Bình Định')).toBe('binh dinh');
    expect(stripProvinceType('Gia Lai')).toBe('gia lai');
  });

  it('builds alias lookup keys with and without type', () => {
    const keys = provinceAliasKeys('Hồ Chí Minh');
    expect(keys).toContain('ho chi minh');
    expect(keys).toContain('thanh pho ho chi minh');
    expect(keys).toContain('tinh ho chi minh');
  });
});
