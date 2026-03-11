import { VietnamAdminDB, OldWard, NewWard, NewProvince, OldProvince } from './indexeddb';

export class WardLookupService {
  private db: VietnamAdminDB | null = null;

  async init(): Promise<void> {
    if (!this.db) {
      this.db = new VietnamAdminDB();
      await this.db.init();
    }
  }

  async findOldWard(wardCode: string): Promise<OldWard | null> {
    await this.init();
    return this.db!.getOldWard(wardCode);
  }

  async findNewWard(wardCode: string): Promise<NewWard | null> {
    await this.init();
    return this.db!.getNewWard(wardCode);
  }

  async getNewWardsFromOld(oldWardCode: string): Promise<NewWard[]> {
    await this.init();

    const mappings = await this.db!.getWardMappingsByOldCode(oldWardCode);
    const newWards: NewWard[] = [];

    for (const mapping of mappings) {
      const newWard = await this.db!.getNewWard(mapping.new_ward_code);
      if (newWard) newWards.push(newWard);
    }

    return newWards;
  }

  async getOldWardsFromNew(newWardCode: string): Promise<OldWard[]> {
    await this.init();

    const mappings = await this.db!.getWardMappingsByNewCode(newWardCode);
    const oldWards: OldWard[] = [];

    for (const mapping of mappings) {
      const oldWard = await this.db!.getOldWard(mapping.old_ward_code);
      if (oldWard) {
        oldWards.push(oldWard);
      }
    }

    return oldWards;
  }

  async findNewWardsByName(wardName: string): Promise<NewWard[]> {
    await this.init();
    return this.db!.getNewWardsByName(wardName);
  }

  async findNewWardsByNameAndProvince(wardName: string, provinceName: string): Promise<NewWard[]> {
    await this.init();
    return this.db!.getNewWardsByNameAndProvince(wardName, provinceName);
  }

  async searchNewWards(query: string, provinceQuery?: string): Promise<NewWard[]> {
    await this.init();
    return this.db!.searchNewWards(query, provinceQuery);
  }

  async searchOldWards(query: string, districtQuery?: string, provinceQuery?: string): Promise<OldWard[]> {
    await this.init();
    return this.db!.searchOldWards(query, districtQuery, provinceQuery);
  }

  async findNewWardsByProvince(provinceName: string): Promise<NewWard[]> {
    await this.init();
    return this.db!.getNewWardsByProvince(provinceName);
  }

  async getAllOldProvinces(): Promise<OldProvince[]> {
    await this.init();
    return this.db!.getAllOldProvinces();
  }

  async getAllNewProvinces(): Promise<NewProvince[]> {
    await this.init();
    return this.db!.getAllNewProvinces();
  }

  async getDistrictsByProvince(provinceName: string): Promise<string[]> {
    await this.init();
    return this.db!.getDistrictsByProvince(provinceName);
  }

  async getOldWardsByDistrictAndProvince(districtName: string, provinceName: string): Promise<OldWard[]> {
    await this.init();
    return this.db!.getOldWardsByDistrictAndProvince(districtName, provinceName);
  }

  async getOldProvincesFromNewProvince(newProvinceName: string): Promise<OldProvince[]> {
    await this.init();
    const newWards = await this.db!.getNewWardsByProvince(newProvinceName);

    const oldProvinceNames = new Set<string>();

    // Sample evenly across wards — new provinces typically merged 1–3 old ones
    const SAMPLE = 20;
    const step = Math.max(1, Math.floor(newWards.length / SAMPLE));
    const sample = newWards.filter((_, i) => i % step === 0).slice(0, SAMPLE);

    for (const newWard of sample) {
      const mappings = await this.db!.getWardMappingsByNewCode(newWard.ward_code);
      for (const mapping of mappings) {
        const oldWard = await this.db!.getOldWard(mapping.old_ward_code);
        if (oldWard) oldProvinceNames.add(oldWard.province_name);
      }
    }

    if (oldProvinceNames.size === 0) return [];

    const allOldProvinces = await this.db!.getAllOldProvinces();
    return allOldProvinces.filter((p) => oldProvinceNames.has(p.name));
  }

  async getNewProvincesFromOldProvince(oldProvinceName: string): Promise<NewProvince[]> {
    await this.init();
    const oldWards = await this.db!.getOldWardsByProvince(oldProvinceName);

    const newProvinceNames = new Set<string>();

    for (const oldWard of oldWards) {
      const mappings = await this.db!.getWardMappingsByOldCode(oldWard.ward_code);
      for (const mapping of mappings) {
        const newWard = await this.db!.getNewWard(mapping.new_ward_code);
        if (newWard) newProvinceNames.add(newWard.province_name);
      }
      if (newProvinceNames.size > 0) break; // old provinces map 1-to-1 to new provinces
    }

    if (newProvinceNames.size === 0) return [];

    const allNewProvinces = await this.db!.getAllNewProvinces();
    return allNewProvinces.filter((p) => newProvinceNames.has(p.name));
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export a singleton instance for easy use across the extension
export const wardLookup = new WardLookupService();