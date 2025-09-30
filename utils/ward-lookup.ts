import { VietnamAdminDB, OldWard, NewWard, WardMapping } from './indexeddb';

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

  async getNewWardFromOld(oldWardCode: string): Promise<NewWard | null> {
    await this.init();

    const mappings = await this.db!.getWardMappingsByOldCode(oldWardCode);
    if (mappings.length === 0) return null;

    // Get the first mapping (there might be multiple)
    const mapping = mappings[0];
    return this.db!.getNewWard(mapping.new_ward_code);
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

  async getAllMappingsForOldWard(oldWardCode: string): Promise<WardMapping[]> {
    await this.init();
    return this.db!.getWardMappingsByOldCode(oldWardCode);
  }

  async getAllMappingsForNewWard(newWardCode: string): Promise<WardMapping[]> {
    await this.init();
    return this.db!.getWardMappingsByNewCode(newWardCode);
  }

  async findNewWardsByName(wardName: string): Promise<NewWard[]> {
    await this.init();
    return this.db!.getNewWardsByName(wardName);
  }

  async findNewWardsByNameAndProvince(wardName: string, provinceName: string): Promise<NewWard[]> {
    await this.init();
    return this.db!.getNewWardsByNameAndProvince(wardName, provinceName);
  }

  async findOldWardsByName(wardName: string): Promise<OldWard[]> {
    await this.init();
    return this.db!.getOldWardsByName(wardName);
  }

  async findOldWardsByDistrict(districtName: string): Promise<OldWard[]> {
    await this.init();
    return this.db!.getOldWardsByDistrict(districtName);
  }

  async findOldWardsByProvince(provinceName: string): Promise<OldWard[]> {
    await this.init();
    return this.db!.getOldWardsByProvince(provinceName);
  }

  async findNewWardsByProvince(provinceName: string): Promise<NewWard[]> {
    await this.init();
    return this.db!.getNewWardsByProvince(provinceName);
  }

  async findOldWardsByFullAddress(wardName: string, districtName: string, provinceName: string): Promise<OldWard[]> {
    await this.init();
    return this.db!.getOldWardsByFullAddress(wardName, districtName, provinceName);
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