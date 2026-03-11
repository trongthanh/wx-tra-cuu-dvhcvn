import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { WardLookupService } from '../utils/ward-lookup';
import { VietnamAdminDB, OldWard, NewWard, WardMapping } from '../utils/indexeddb';

// Seed helpers
function oldWard(overrides: Partial<OldWard> = {}): OldWard {
  return {
    ward_code: '001',
    ward_name: 'Phường 1',
    ward_index: 'phuong 1',
    district_name: 'Quận 1',
    district_index: 'quan 1',
    province_name: 'Thành phố Hồ Chí Minh',
    province_index: 'thanh pho ho chi minh',
    ...overrides,
  };
}

function newWard(overrides: Partial<NewWard> = {}): NewWard {
  return {
    ward_code: '101',
    ward_name: 'Phường Bến Nghé',
    ward_index: 'phuong ben nghe',
    province_name: 'Thành phố Hồ Chí Minh',
    province_index: 'thanh pho ho chi minh',
    ...overrides,
  };
}

function mapping(newCode: string, oldCode: string): WardMapping {
  return { new_ward_code: newCode, old_ward_code: oldCode };
}

let service: WardLookupService;
let db: VietnamAdminDB;

beforeEach(async () => {
  global.indexedDB = new IDBFactory();
  db = new VietnamAdminDB();
  await db.init();

  service = new WardLookupService();
  // Point the service at the same fresh DB
  await service.init();
});

describe('WardLookupService', () => {
  describe('findOldWard', () => {
    it('returns the old ward by code', async () => {
      await db.insertOldWards([oldWard()]);
      const result = await service.findOldWard('001');
      expect(result?.ward_code).toBe('001');
    });

    it('returns null for unknown code', async () => {
      expect(await service.findOldWard('999')).toBeNull();
    });
  });

  describe('findNewWard', () => {
    it('returns the new ward by code', async () => {
      await db.insertNewWards([newWard()]);
      const result = await service.findNewWard('101');
      expect(result?.ward_code).toBe('101');
    });

    it('returns null for unknown code', async () => {
      expect(await service.findNewWard('999')).toBeNull();
    });
  });

  describe('getNewWardsFromOld', () => {
    it('returns the mapped new wards', async () => {
      await db.insertOldWards([oldWard({ ward_code: '001' })]);
      await db.insertNewWards([newWard({ ward_code: '101' })]);
      await db.insertWardMappings([mapping('101', '001')]);

      const results = await service.getNewWardsFromOld('001');
      expect(results).toHaveLength(1);
      expect(results[0].ward_code).toBe('101');
    });

    it('returns empty array when no mapping exists', async () => {
      expect(await service.getNewWardsFromOld('001')).toEqual([]);
    });

    it('returns all mapped new wards when multiple mappings exist', async () => {
      await db.insertNewWards([
        newWard({ ward_code: '101' }),
        newWard({ ward_code: '102', ward_name: 'Phường B', ward_index: 'phuong b' }),
      ]);
      await db.insertWardMappings([mapping('101', '001'), mapping('102', '001')]);

      const results = await service.getNewWardsFromOld('001');
      expect(results).toHaveLength(2);
    });
  });

  describe('getOldWardsFromNew', () => {
    it('returns all old wards mapped to a new ward', async () => {
      await db.insertOldWards([
        oldWard({ ward_code: '001' }),
        oldWard({ ward_code: '002', ward_name: 'Phường 2', ward_index: 'phuong 2' }),
      ]);
      await db.insertWardMappings([mapping('101', '001'), mapping('101', '002')]);

      const results = await service.getOldWardsFromNew('101');
      expect(results).toHaveLength(2);
      expect(results.map(w => w.ward_code).sort()).toEqual(['001', '002']);
    });

    it('returns empty array when no mappings exist', async () => {
      expect(await service.getOldWardsFromNew('101')).toEqual([]);
    });

    it('skips mappings whose old ward code does not exist in DB', async () => {
      // mapping references old ward '001' but it's not inserted
      await db.insertWardMappings([mapping('101', '001')]);
      const results = await service.getOldWardsFromNew('101');
      expect(results).toEqual([]);
    });
  });

  describe('findNewWardsByName', () => {
    it('finds new wards by Vietnamese name', async () => {
      await db.insertNewWards([
        newWard({ ward_code: '101', ward_name: 'Phường Bến Nghé', ward_index: 'phuong ben nghe' }),
        newWard({ ward_code: '102', ward_name: 'Phường Đa Kao', ward_index: 'phuong da kao' }),
      ]);
      const results = await service.findNewWardsByName('Phường Bến Nghé');
      expect(results).toHaveLength(1);
      expect(results[0].ward_code).toBe('101');
    });

    it('returns empty array when name not found', async () => {
      expect(await service.findNewWardsByName('Phường Không Tồn Tại')).toEqual([]);
    });
  });

  describe('findNewWardsByNameAndProvince', () => {
    it('filters by both name and province', async () => {
      await db.insertNewWards([
        newWard({ ward_code: '101', ward_name: 'Phường A', ward_index: 'phuong a', province_name: 'Thành phố Hồ Chí Minh', province_index: 'thanh pho ho chi minh' }),
        newWard({ ward_code: '102', ward_name: 'Phường A', ward_index: 'phuong a', province_name: 'Hà Nội', province_index: 'ha noi' }),
      ]);
      const results = await service.findNewWardsByNameAndProvince('Phường A', 'Thành phố Hồ Chí Minh');
      expect(results).toHaveLength(1);
      expect(results[0].ward_code).toBe('101');
    });
  });

  describe('findNewWardsByProvince', () => {
    it('finds new wards by province name', async () => {
      await db.insertNewWards([
        newWard({ ward_code: '101', province_name: 'Thành phố Hồ Chí Minh', province_index: 'thanh pho ho chi minh' }),
        newWard({ ward_code: '102', ward_name: 'Phường B', ward_index: 'phuong b', province_name: 'Hà Nội', province_index: 'ha noi' }),
      ]);
      const results = await service.findNewWardsByProvince('Thành phố Hồ Chí Minh');
      expect(results).toHaveLength(1);
      expect(results[0].ward_code).toBe('101');
    });
  });

});
