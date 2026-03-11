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

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export a singleton instance for easy use across the extension
export const wardLookup = new WardLookupService();