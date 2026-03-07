import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { normalizeStr } from './normalizeStr';

export interface OldWard {
  ward_code: string;
  ward_name: string;
  ward_index: string;
  district_name: string;
  district_index: string;
  province_name: string;
  province_index: string;
}

export interface NewWard {
  ward_code: string;
  ward_name: string;
  ward_index: string;
  province_name: string;
  province_index: string;
}

export interface NewProvince {
  code: string;
  name: string;
  name_index: string;
  letter_code: string;
  type: string;
  alias: string;
}

export interface OldProvince {
  code: string;
  name: string;
  name_index: string;
  type: string;
  alias: string;
}

export interface WardMapping {
  new_ward_code: string;
  old_ward_code: string;
}

export interface VersionInfo {
  version: string;
  lastUpdated: number;
}

interface VietnamAdminSchema extends DBSchema {
  old_wards: {
    key: string;
    value: OldWard;
    indexes: {
      ward_index: string;
      district_index: string;
      province_index: string;
      province_district: [string, string];
    };
  };
  new_wards: {
    key: string;
    value: NewWard;
    indexes: {
      ward_index: string;
      province_index: string;
    };
  };
  new_provinces: {
    key: string;
    value: NewProvince;
    indexes: {
      name_index: string;
      letter_code: string;
    };
  };
  old_provinces: {
    key: string;
    value: OldProvince;
    indexes: {
      name_index: string;
    };
  };
  ward_mappings: {
    key: number;
    value: WardMapping;
    indexes: {
      old_ward_code: string;
      new_ward_code: string;
    };
  };
  version_info: {
    key: string;
    value: VersionInfo & { id: string };
  };
}

const DB_NAME = 'vietnam_admin_units';
const DB_VERSION = 1;

export class VietnamAdminDB {
  private db: IDBPDatabase<VietnamAdminSchema> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<VietnamAdminSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create old_wards store
        const oldWardsStore = db.createObjectStore('old_wards', { keyPath: 'ward_code' });
        oldWardsStore.createIndex('ward_index', 'ward_index', { unique: false });
        oldWardsStore.createIndex('district_index', 'district_index', { unique: false });
        oldWardsStore.createIndex('province_index', 'province_index', { unique: false });
        oldWardsStore.createIndex(
          'province_district',
          ['province_index', 'district_index'],
          { unique: false }
        );

        // Create new_wards store
        const newWardsStore = db.createObjectStore('new_wards', { keyPath: 'ward_code' });
        newWardsStore.createIndex('ward_index', 'ward_index', { unique: false });
        newWardsStore.createIndex('province_index', 'province_index', { unique: false });

        // Create new_provinces store
        const newProvincesStore = db.createObjectStore('new_provinces', { keyPath: 'code' });
        newProvincesStore.createIndex('name_index', 'name_index', { unique: false });
        newProvincesStore.createIndex('letter_code', 'letter_code', { unique: false });

        // Create old_provinces store
        const oldProvincesStore = db.createObjectStore('old_provinces', { keyPath: 'code' });
        oldProvincesStore.createIndex('name_index', 'name_index', { unique: false });

        // Create ward_mappings store
        const mappingStore = db.createObjectStore('ward_mappings', { autoIncrement: true });
        mappingStore.createIndex('old_ward_code', 'old_ward_code', { unique: false });
        mappingStore.createIndex('new_ward_code', 'new_ward_code', { unique: false });

        // Create version_info store
        db.createObjectStore('version_info', { keyPath: 'id' });
      },
    });
  }

  async getVersion(): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.get('version_info', 'current');
    return result?.version || null;
  }

  async setVersion(version: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const versionInfo: VersionInfo & { id: string } = {
      id: 'current',
      version,
      lastUpdated: Date.now(),
    };
    await this.db.put('version_info', versionInfo);
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(
      ['old_wards', 'new_wards', 'new_provinces', 'old_provinces', 'ward_mappings'],
      'readwrite'
    );
    await Promise.all([
      tx.objectStore('old_wards').clear(),
      tx.objectStore('new_wards').clear(),
      tx.objectStore('new_provinces').clear(),
      tx.objectStore('old_provinces').clear(),
      tx.objectStore('ward_mappings').clear(),
    ]);
    await tx.done;
  }

  async bulkInsert<T>(
    storeName: 'old_wards' | 'new_wards' | 'new_provinces' | 'old_provinces' | 'ward_mappings',
    data: T[]
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    if (data.length === 0) return;

    const tx = this.db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);

    await Promise.all(data.map((item) => store.put(item as any)));
    await tx.done;
  }

  async insertOldWards(wards: OldWard[]): Promise<void> {
    return this.bulkInsert('old_wards', wards);
  }

  async insertNewWards(wards: NewWard[]): Promise<void> {
    return this.bulkInsert('new_wards', wards);
  }

  async insertWardMappings(mappings: WardMapping[]): Promise<void> {
    return this.bulkInsert('ward_mappings', mappings);
  }

  async insertNewProvinces(provinces: NewProvince[]): Promise<void> {
    return this.bulkInsert('new_provinces', provinces);
  }

  async insertOldProvinces(provinces: OldProvince[]): Promise<void> {
    return this.bulkInsert('old_provinces', provinces);
  }

  async getOldWard(wardCode: string): Promise<OldWard | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.get('old_wards', wardCode);
    return result || null;
  }

  async getNewWard(wardCode: string): Promise<NewWard | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.get('new_wards', wardCode);
    return result || null;
  }

  async getWardMappingsByOldCode(oldWardCode: string): Promise<WardMapping[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllFromIndex('ward_mappings', 'old_ward_code', oldWardCode);
    return result || [];
  }

  async getWardMappingsByNewCode(newWardCode: string): Promise<WardMapping[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllFromIndex('ward_mappings', 'new_ward_code', newWardCode);
    return result || [];
  }

  async getNewWardsByName(wardName: string): Promise<NewWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const normalizedName = normalizeStr(wardName);
    const result = await this.db.getAllFromIndex('new_wards', 'ward_index', normalizedName);
    return result || [];
  }

  async getNewWardsByNameAndProvince(wardName: string, provinceName: string): Promise<NewWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const normalizedWardName = normalizeStr(wardName);
    const normalizedProvinceName = normalizeStr(provinceName);

    // Get all wards with matching name, then filter by province
    const wards = await this.db.getAllFromIndex('new_wards', 'ward_index', normalizedWardName);
    return wards.filter(ward => ward.province_index === normalizedProvinceName);
  }

  async getOldWardsByName(wardName: string): Promise<OldWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const normalizedName = normalizeStr(wardName);
    const result = await this.db.getAllFromIndex('old_wards', 'ward_index', normalizedName);
    return result || [];
  }

  async getOldWardsByDistrict(districtName: string): Promise<OldWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const normalizedName = normalizeStr(districtName);
    const result = await this.db.getAllFromIndex('old_wards', 'district_index', normalizedName);
    return result || [];
  }

  async getOldWardsByProvince(provinceName: string): Promise<OldWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const normalizedName = normalizeStr(provinceName);
    const result = await this.db.getAllFromIndex('old_wards', 'province_index', normalizedName);
    return result || [];
  }

  async getNewWardsByProvince(provinceName: string): Promise<NewWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const normalizedName = normalizeStr(provinceName);
    const result = await this.db.getAllFromIndex('new_wards', 'province_index', normalizedName);
    return result || [];
  }

  async getOldWardsByFullAddress(
    wardName: string,
    districtName: string,
    provinceName: string
  ): Promise<OldWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const normalizedWardName = normalizeStr(wardName);
    const normalizedDistrictName = normalizeStr(districtName);
    const normalizedProvinceName = normalizeStr(provinceName);

    // Get all wards with matching name, then filter by district and province
    const wards = await this.db.getAllFromIndex('old_wards', 'ward_index', normalizedWardName);
    return wards.filter(
      ward => ward.district_index === normalizedDistrictName && ward.province_index === normalizedProvinceName
    );
  }

  async getDistrictsByProvince(provinceName: string): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    const normalizedProvinceName = normalizeStr(provinceName);

    // Get all wards in the province, then extract unique districts
    const wards = await this.db.getAllFromIndex('old_wards', 'province_index', normalizedProvinceName);
    const uniqueDistricts = new Set<string>();

    for (const ward of wards) {
      uniqueDistricts.add(ward.district_name);
    }

    return Array.from(uniqueDistricts).sort();
  }

  async getOldWardsByDistrictAndProvince(
    districtName: string,
    provinceName: string
  ): Promise<OldWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const normalizedDistrictName = normalizeStr(districtName);
    const normalizedProvinceName = normalizeStr(provinceName);

    // Get all wards with matching district, then filter by province
    const wards = await this.db.getAllFromIndex('old_wards', 'district_index', normalizedDistrictName);
    return wards.filter(ward => ward.province_index === normalizedProvinceName);
  }

  async getAllNewProvinces(): Promise<NewProvince[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAll('new_provinces');
    return result || [];
  }

  async getAllOldProvinces(): Promise<OldProvince[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAll('old_provinces');
    return result || [];
  }

  async getNewProvince(code: string): Promise<NewProvince | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.get('new_provinces', code);
    return result || null;
  }

  async getOldProvince(code: string): Promise<OldProvince | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.get('old_provinces', code);
    return result || null;
  }

  async searchNewWards(query: string, provinceQuery?: string): Promise<NewWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const normalizedQuery = normalizeStr(query);
    if (!normalizedQuery) return [];

    const WARD_PREFIXES = ['phuong ', 'xa ', 'thi tran '];
    const PROVINCE_PREFIXES = ['tinh ', 'thanh pho '];

    // Build search variants: the query as-is, plus with ward prefixes prepended
    const wardQueries = [normalizedQuery];
    const hasWardPrefix = WARD_PREFIXES.some((p) => normalizedQuery.startsWith(p));
    if (!hasWardPrefix) {
      for (const prefix of WARD_PREFIXES) {
        wardQueries.push(prefix + normalizedQuery);
      }
    }

    // Search all variants using prefix matching
    const seen = new Set<string>();
    const results: NewWard[] = [];

    for (const wq of wardQueries) {
      const range = IDBKeyRange.bound(wq, wq + '\uffff', false, false);
      const matches = await this.db.getAllFromIndex('new_wards', 'ward_index', range);
      for (const w of matches) {
        if (!seen.has(w.ward_code)) {
          seen.add(w.ward_code);
          results.push(w);
        }
      }
    }

    // Filter by province if provided
    if (provinceQuery) {
      const normalizedProvince = normalizeStr(provinceQuery);
      if (normalizedProvince) {
        const provinceVariants = [normalizedProvince];
        const hasProvincePrefix = PROVINCE_PREFIXES.some((p) => normalizedProvince.startsWith(p));
        if (!hasProvincePrefix) {
          for (const prefix of PROVINCE_PREFIXES) {
            provinceVariants.push(prefix + normalizedProvince);
          }
        }
        return results.filter((w) =>
          provinceVariants.some((pv) => w.province_index.startsWith(pv))
        );
      }
    }

    return results;
  }

  async searchOldWards(query: string, districtQuery?: string, provinceQuery?: string): Promise<OldWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const normalizedQuery = normalizeStr(query);
    if (!normalizedQuery) return [];

    const WARD_PREFIXES = ['phuong ', 'xa ', 'thi tran '];
    const DISTRICT_PREFIXES = ['quan ', 'huyen ', 'thi xa ', 'thanh pho '];
    const PROVINCE_PREFIXES = ['tinh ', 'thanh pho '];

    const wardQueries = [normalizedQuery];
    const hasWardPrefix = WARD_PREFIXES.some((p) => normalizedQuery.startsWith(p));
    if (!hasWardPrefix) {
      for (const prefix of WARD_PREFIXES) {
        wardQueries.push(prefix + normalizedQuery);
      }
    }

    const seen = new Set<string>();
    let results: OldWard[] = [];

    for (const wq of wardQueries) {
      const range = IDBKeyRange.bound(wq, wq + '\uffff', false, false);
      const matches = await this.db.getAllFromIndex('old_wards', 'ward_index', range);
      for (const w of matches) {
        if (!seen.has(w.ward_code)) {
          seen.add(w.ward_code);
          results.push(w);
        }
      }
    }

    if (districtQuery) {
      const normalizedDistrict = normalizeStr(districtQuery);
      if (normalizedDistrict) {
        const districtVariants = [normalizedDistrict];
        const hasDistrictPrefix = DISTRICT_PREFIXES.some((p) => normalizedDistrict.startsWith(p));
        if (!hasDistrictPrefix) {
          for (const prefix of DISTRICT_PREFIXES) {
            districtVariants.push(prefix + normalizedDistrict);
          }
        }
        results = results.filter((w) =>
          districtVariants.some((dv) => w.district_index.startsWith(dv))
        );
      }
    }

    if (provinceQuery) {
      const normalizedProvince = normalizeStr(provinceQuery);
      if (normalizedProvince) {
        const provinceVariants = [normalizedProvince];
        const hasProvincePrefix = PROVINCE_PREFIXES.some((p) => normalizedProvince.startsWith(p));
        if (!hasProvincePrefix) {
          for (const prefix of PROVINCE_PREFIXES) {
            provinceVariants.push(prefix + normalizedProvince);
          }
        }
        results = results.filter((w) =>
          provinceVariants.some((pv) => w.province_index.startsWith(pv))
        );
      }
    }

    return results;
  }

  async getNewProvincesByName(name: string): Promise<NewProvince[]> {
    if (!this.db) throw new Error('Database not initialized');

    const normalizedName = normalizeStr(name);
    const result = await this.db.getAllFromIndex('new_provinces', 'name_index', normalizedName);
    return result || [];
  }

  async getOldProvincesByName(name: string): Promise<OldProvince[]> {
    if (!this.db) throw new Error('Database not initialized');

    const normalizedName = normalizeStr(name);
    const result = await this.db.getAllFromIndex('old_provinces', 'name_index', normalizedName);
    return result || [];
  }

  get database(): IDBPDatabase<VietnamAdminSchema> | null {
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
