import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { VietnamAdminDB, OldWard, NewWard, WardMapping } from '../utils/indexeddb';

function makeOldWard(overrides: Partial<OldWard> = {}): OldWard {
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

function makeNewWard(overrides: Partial<NewWard> = {}): NewWard {
  return {
    ward_code: '101',
    ward_name: 'Phường Mới 1',
    ward_index: 'phuong moi 1',
    province_name: 'Thành phố Hồ Chí Minh',
    province_index: 'thanh pho ho chi minh',
    ...overrides,
  };
}

// Each test gets a fresh in-memory DB by resetting the global IDBFactory
let db: VietnamAdminDB;

beforeEach(async () => {
  global.indexedDB = new IDBFactory();
  db = new VietnamAdminDB();
  await db.init();
});

describe('VietnamAdminDB', () => {
  describe('version_info', () => {
    it('returns null when no version set', async () => {
      expect(await db.getVersion()).toBeNull();
    });

    it('stores and retrieves version', async () => {
      await db.setVersion('1.0.0');
      expect(await db.getVersion()).toBe('1.0.0');
    });

    it('overwrites existing version', async () => {
      await db.setVersion('1.0.0');
      await db.setVersion('2.0.0');
      expect(await db.getVersion()).toBe('2.0.0');
    });
  });

  describe('old_wards', () => {
    it('inserts and retrieves an old ward by code', async () => {
      const ward = makeOldWard();
      await db.insertOldWards([ward]);
      expect(await db.getOldWard('001')).toEqual(ward);
    });

    it('returns null for missing ward code', async () => {
      expect(await db.getOldWard('999')).toBeNull();
    });

    it('finds old wards by name index', async () => {
      const ward = makeOldWard();
      await db.insertOldWards([ward]);
      const results = await db.getOldWardsByName('Phường 1');
      expect(results).toHaveLength(1);
      expect(results[0].ward_code).toBe('001');
    });

    it('finds old wards by district', async () => {
      await db.insertOldWards([
        makeOldWard({ ward_code: '001', district_name: 'Quận 1', district_index: 'quan 1' }),
        makeOldWard({ ward_code: '002', ward_name: 'Phường 2', ward_index: 'phuong 2', district_name: 'Quận 1', district_index: 'quan 1' }),
        makeOldWard({ ward_code: '003', ward_name: 'Phường 3', ward_index: 'phuong 3', district_name: 'Quận 2', district_index: 'quan 2' }),
      ]);
      const results = await db.getOldWardsByDistrict('Quận 1');
      expect(results).toHaveLength(2);
    });

    it('finds old wards by province', async () => {
      await db.insertOldWards([
        makeOldWard({ ward_code: '001' }),
        makeOldWard({ ward_code: '002', ward_name: 'Phường 2', ward_index: 'phuong 2', province_name: 'Hà Nội', province_index: 'ha noi' }),
      ]);
      const results = await db.getOldWardsByProvince('Thành phố Hồ Chí Minh');
      expect(results).toHaveLength(1);
      expect(results[0].ward_code).toBe('001');
    });

    it('finds old wards by full address', async () => {
      await db.insertOldWards([
        makeOldWard({ ward_code: '001' }),
        makeOldWard({ ward_code: '002', ward_name: 'Phường 1', ward_index: 'phuong 1', district_name: 'Quận 2', district_index: 'quan 2' }),
      ]);
      const results = await db.getOldWardsByFullAddress('Phường 1', 'Quận 1', 'Thành phố Hồ Chí Minh');
      expect(results).toHaveLength(1);
      expect(results[0].ward_code).toBe('001');
    });
  });

  describe('new_wards', () => {
    it('inserts and retrieves a new ward by code', async () => {
      const ward = makeNewWard();
      await db.insertNewWards([ward]);
      expect(await db.getNewWard('101')).toEqual(ward);
    });

    it('returns null for missing ward code', async () => {
      expect(await db.getNewWard('999')).toBeNull();
    });

    it('finds new wards by name', async () => {
      await db.insertNewWards([makeNewWard()]);
      const results = await db.getNewWardsByName('Phường Mới 1');
      expect(results).toHaveLength(1);
    });

    it('finds new wards by province', async () => {
      await db.insertNewWards([
        makeNewWard({ ward_code: '101' }),
        makeNewWard({ ward_code: '102', ward_name: 'Phường B', ward_index: 'phuong b', province_name: 'Hà Nội', province_index: 'ha noi' }),
      ]);
      const results = await db.getNewWardsByProvince('Thành phố Hồ Chí Minh');
      expect(results).toHaveLength(1);
      expect(results[0].ward_code).toBe('101');
    });

    it('finds new wards by name and province', async () => {
      await db.insertNewWards([
        makeNewWard({ ward_code: '101', ward_name: 'Phường A', ward_index: 'phuong a', province_name: 'Thành phố Hồ Chí Minh', province_index: 'thanh pho ho chi minh' }),
        makeNewWard({ ward_code: '102', ward_name: 'Phường A', ward_index: 'phuong a', province_name: 'Hà Nội', province_index: 'ha noi' }),
      ]);
      const results = await db.getNewWardsByNameAndProvince('Phường A', 'Thành phố Hồ Chí Minh');
      expect(results).toHaveLength(1);
      expect(results[0].ward_code).toBe('101');
    });
  });

  describe('ward_mappings', () => {
    it('inserts and retrieves mappings by old code', async () => {
      const mapping: WardMapping = { new_ward_code: '101', old_ward_code: '001' };
      await db.insertWardMappings([mapping]);
      const results = await db.getWardMappingsByOldCode('001');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mapping);
    });

    it('inserts and retrieves mappings by new code', async () => {
      await db.insertWardMappings([
        { new_ward_code: '101', old_ward_code: '001' },
        { new_ward_code: '101', old_ward_code: '002' },
      ]);
      const results = await db.getWardMappingsByNewCode('101');
      expect(results).toHaveLength(2);
    });

    it('returns empty array when no mappings found', async () => {
      expect(await db.getWardMappingsByOldCode('999')).toEqual([]);
    });
  });

  describe('clearAllData', () => {
    it('clears all stores', async () => {
      await db.insertOldWards([makeOldWard()]);
      await db.insertNewWards([makeNewWard()]);
      await db.clearAllData();
      expect(await db.getOldWard('001')).toBeNull();
      expect(await db.getNewWard('101')).toBeNull();
    });
  });
});
