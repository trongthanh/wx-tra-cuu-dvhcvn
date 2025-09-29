import { openDB, DBSchema, IDBPDatabase } from 'idb';

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
      ward_district_province_index: [string, string, string];
    };
  };
  new_wards: {
    key: string;
    value: NewWard;
    indexes: {
      ward_index: string;
      province_index: string;
      ward_province_index: [string, string];
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
      upgrade(db, oldVersion) {
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('old_wards')) {
          const oldWardsStore = db.createObjectStore('old_wards', { keyPath: 'ward_code' });
          oldWardsStore.createIndex('ward_index', 'ward_index', { unique: false });
          oldWardsStore.createIndex('district_index', 'district_index', { unique: false });
          oldWardsStore.createIndex('province_index', 'province_index', { unique: false });
          oldWardsStore.createIndex(
            'ward_district_province_index',
            ['ward_index', 'district_index', 'province_index'],
            { unique: false }
          );
        }

        if (!db.objectStoreNames.contains('new_wards')) {
          const newWardsStore = db.createObjectStore('new_wards', { keyPath: 'ward_code' });
          newWardsStore.createIndex('ward_index', 'ward_index', { unique: false });
          newWardsStore.createIndex('province_index', 'province_index', { unique: false });
          newWardsStore.createIndex('ward_province_index', ['ward_index', 'province_index'], {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains('ward_mappings')) {
          const mappingStore = db.createObjectStore('ward_mappings', { autoIncrement: true });
          mappingStore.createIndex('old_ward_code', 'old_ward_code', { unique: false });
          mappingStore.createIndex('new_ward_code', 'new_ward_code', { unique: false });
        }

        if (!db.objectStoreNames.contains('version_info')) {
          db.createObjectStore('version_info', { keyPath: 'id' });
        }
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

    const tx = this.db.transaction(['old_wards', 'new_wards', 'ward_mappings'], 'readwrite');
    await Promise.all([
      tx.objectStore('old_wards').clear(),
      tx.objectStore('new_wards').clear(),
      tx.objectStore('ward_mappings').clear(),
    ]);
    await tx.done;
  }

  async bulkInsert<T>(
    storeName: 'old_wards' | 'new_wards' | 'ward_mappings',
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

    const result = await this.db.getAllFromIndex('new_wards', 'ward_index', wardName);
    return result || [];
  }

  async getNewWardsByNameAndProvince(wardName: string, provinceName: string): Promise<NewWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllFromIndex('new_wards', 'ward_province_index', [
      wardName,
      provinceName,
    ]);
    return result || [];
  }

  async getOldWardsByName(wardName: string): Promise<OldWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllFromIndex('old_wards', 'ward_index', wardName);
    return result || [];
  }

  async getOldWardsByDistrict(districtName: string): Promise<OldWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllFromIndex('old_wards', 'district_index', districtName);
    return result || [];
  }

  async getOldWardsByProvince(provinceName: string): Promise<OldWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllFromIndex('old_wards', 'province_index', provinceName);
    return result || [];
  }

  async getNewWardsByProvince(provinceName: string): Promise<NewWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllFromIndex('new_wards', 'province_index', provinceName);
    return result || [];
  }

  async getOldWardsByFullAddress(
    wardName: string,
    districtName: string,
    provinceName: string
  ): Promise<OldWard[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllFromIndex('old_wards', 'ward_district_province_index', [
      wardName,
      districtName,
      provinceName,
    ]);
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
