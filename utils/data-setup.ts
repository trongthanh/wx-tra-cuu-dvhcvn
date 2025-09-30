import { deleteDB } from 'idb';
import { VietnamAdminDB, OldWard, NewWard, WardMapping, NewProvince, OldProvince } from './indexeddb';
import { parseCSV } from './csv-parser';
import { normalizeStr } from './normalizeStr';

/**
 * Data version when csv files change
 */
export const DATA_VERSION = '1.0.0';

export class DataSetup {
  private db: VietnamAdminDB;

  constructor() {
    this.db = new VietnamAdminDB();
  }

  async checkAndUpdateData(): Promise<boolean> {
    try {
      await this.db.init();

      const currentVersion = await this.db.getVersion();

      if (currentVersion === DATA_VERSION) {
        console.log('Data is up to date, version:', currentVersion);
        return false; // No update needed
      }

      console.log('Data version mismatch. Current:', currentVersion, 'Required:', DATA_VERSION);
      console.log('Updating data...');

      await this.updateData();

      console.log('Data update completed successfully');
      return true; // Data was updated
    } catch (error) {
      console.error('Error during data setup:', error);
      throw error;
    }
  }

  private async updateData(): Promise<void> {
    // Clear existing data
    await this.db.clearAllData();

    // Load and parse CSV files
    const [oldWardsData, newWardsData, wardMappingsData, newProvincesData, oldProvincesData] = await Promise.all([
      this.loadCSVFile('/data/old_wards.csv'),
      this.loadCSVFile('/data/new_wards.csv'),
      this.loadCSVFile('/data/ward_mappings.csv'),
      this.loadCSVFile('/data/new_provinces.csv'),
      this.loadCSVFile('/data/old_provinces.csv'),
    ]);

    // Transform and insert data
    const oldWards: OldWard[] = oldWardsData.map((row) => ({
      ward_code: row.ward_code,
      ward_name: row.ward_name,
      ward_index: normalizeStr(row.ward_name),
      district_name: row.district_name,
      district_index: normalizeStr(row.district_name),
      province_name: row.province_name,
      province_index: normalizeStr(row.province_name),
    }));

    const newWards: NewWard[] = newWardsData.map((row) => ({
      ward_code: row.ward_code,
      ward_name: row.ward_name,
      ward_index: normalizeStr(row.ward_name),
      province_name: row.province_name,
      province_index: normalizeStr(row.province_name),
    }));

    const wardMappings: WardMapping[] = wardMappingsData.map((row) => ({
      new_ward_code: row.new_ward_code,
      old_ward_code: row.old_ward_code,
    }));

    const newProvinces: NewProvince[] = newProvincesData.map((row) => ({
      code: row.code,
      name: row.name,
      name_index: normalizeStr(row.name),
      letter_code: row.letter_code,
      type: row.type,
      alias: row.alias,
    }));

    const oldProvinces: OldProvince[] = oldProvincesData.map((row) => ({
      code: row.code,
      name: row.name,
      name_index: normalizeStr(row.name),
      type: row.type,
      alias: row.alias,
    }));

    // Insert data into IndexedDB
    await Promise.all([
      this.db.insertOldWards(oldWards),
      this.db.insertNewWards(newWards),
      this.db.insertWardMappings(wardMappings),
      this.db.insertNewProvinces(newProvinces),
      this.db.insertOldProvinces(oldProvinces),
    ]);

    // Update version
    await this.db.setVersion(DATA_VERSION);

    console.log(
      `Data loaded: ${oldWards.length} old wards, ${newWards.length} new wards, ${wardMappings.length} mappings, ${newProvinces.length} new provinces, ${oldProvinces.length} old provinces`
    );
  }

  private async loadCSVFile(path: string): Promise<Record<string, string>[]> {
    try {
      const response = await fetch(browser.runtime.getURL(path as any));
      if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.statusText}`);
      }
      const csvText = await response.text();
      return parseCSV(csvText);
    } catch (error) {
      console.error(`Error loading CSV file ${path}:`, error);
      throw error;
    }
  }

  getDatabase(): VietnamAdminDB {
    return this.db;
  }

  private async deleteDatabase(): Promise<void> {
    try {
      await deleteDB('vietnam_admin_units');
      console.log('Database deleted successfully');
    } catch (error) {
      console.error('Error deleting database:', error);
      throw error;
    }
  }

  close(): void {
    this.db.close();
  }
}

