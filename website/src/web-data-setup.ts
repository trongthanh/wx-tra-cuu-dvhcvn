import { VietnamAdminDB, OldWard, NewWard, WardMapping, NewProvince, OldProvince } from '@/utils/indexeddb';
import { parseCSV } from '@/utils/csv-parser';
import { normalizeStr } from '@/utils/strings';

const DATA_VERSION = '1.0.0';

export class WebDataSetup {
  private db: VietnamAdminDB;

  constructor() {
    this.db = new VietnamAdminDB();
  }

  async checkAndUpdateData(): Promise<boolean> {
    await this.db.init();

    const currentVersion = await this.db.getVersion();

    if (currentVersion === DATA_VERSION) {
      return false;
    }

    await this.updateData();
    return true;
  }

  private async updateData(): Promise<void> {
    await this.db.clearAllData();

    const [oldWardsData, newWardsData, wardMappingsData, newProvincesData, oldProvincesData] =
      await Promise.all([
        this.loadCSVFile('/data/old_wards.csv'),
        this.loadCSVFile('/data/new_wards.csv'),
        this.loadCSVFile('/data/ward_mappings.csv'),
        this.loadCSVFile('/data/new_provinces.csv'),
        this.loadCSVFile('/data/old_provinces.csv'),
      ]);

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

    await Promise.all([
      this.db.insertOldWards(oldWards),
      this.db.insertNewWards(newWards),
      this.db.insertWardMappings(wardMappings),
      this.db.insertNewProvinces(newProvinces),
      this.db.insertOldProvinces(oldProvinces),
    ]);

    await this.db.setVersion(DATA_VERSION);
  }

  private async loadCSVFile(path: string): Promise<Record<string, string>[]> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.statusText}`);
    }
    const csvText = await response.text();
    return parseCSV(csvText);
  }

  close(): void {
    this.db.close();
  }
}
