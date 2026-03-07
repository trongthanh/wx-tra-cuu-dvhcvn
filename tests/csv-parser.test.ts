import { describe, it, expect } from 'vitest';
import { parseCSV } from '../utils/csv-parser';

describe('parseCSV', () => {
  it('parses a simple CSV with headers', () => {
    const csv = 'ward_code,ward_name\n"001","Phường 1"';
    expect(parseCSV(csv)).toEqual([{ ward_code: '001', ward_name: 'Phường 1' }]);
  });

  it('parses multiple rows', () => {
    const csv = 'a,b\n1,2\n3,4';
    expect(parseCSV(csv)).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ]);
  });

  it('handles quoted fields with commas inside', () => {
    const csv = 'name,alias\n"Hà Nội","HN,Hanoi"';
    expect(parseCSV(csv)).toEqual([{ name: 'Hà Nội', alias: 'HN,Hanoi' }]);
  });

  it('handles escaped double quotes inside quoted fields', () => {
    const csv = 'name\n"He said ""hello"""';
    expect(parseCSV(csv)).toEqual([{ name: 'He said "hello"' }]);
  });

  it('returns empty array for header-only CSV', () => {
    expect(parseCSV('a,b,c')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseCSV('')).toEqual([]);
  });

  it('skips rows with wrong column count', () => {
    const csv = 'a,b\n1,2\n3';
    expect(parseCSV(csv)).toEqual([{ a: '1', b: '2' }]);
  });

  it('parses real old_wards format', () => {
    const csv = 'ward_code,ward_name,district_name,province_name\n"26881","Phường 12","Quận Gò Vấp","Thành phố Hồ Chí Minh"';
    expect(parseCSV(csv)).toEqual([
      {
        ward_code: '26881',
        ward_name: 'Phường 12',
        district_name: 'Quận Gò Vấp',
        province_name: 'Thành phố Hồ Chí Minh',
      },
    ]);
  });

  it('parses real new_wards format', () => {
    const csv = 'ward_code,ward_name,province_name\n"26882","Phường An Hội Tây","Thành phố Hồ Chí Minh"';
    expect(parseCSV(csv)).toEqual([
      {
        ward_code: '26882',
        ward_name: 'Phường An Hội Tây',
        province_name: 'Thành phố Hồ Chí Minh',
      },
    ]);
  });
});
