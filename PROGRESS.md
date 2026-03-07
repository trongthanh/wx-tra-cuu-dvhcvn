# Progress Log

## Completed: IndexedDB Indices Enhancement

### Task: Add New Indices for NewWard Store
**Date**: Session completion
**Status**: ✅ Complete

#### Requirements
- Add `ward_name` index to NewWard store in IndexedDB
- Add compound `[ward_name, province_name]` index to NewWard store
- Update ward-lookup service with new lookup methods

#### Files Modified

**1. utils/indexeddb.ts**
- Updated TypeScript schema to include new indices:
  ```typescript
  new_wards: {
    key: string;
    value: NewWard;
    indexes: {
      ward_name: string;
      ward_name_province: [string, string];
    };
  };
  ```
- Modified database upgrade logic to create indices during initialization
- Added new database methods:
  - `getNewWardsByName(wardName: string): Promise<NewWard[]>`
  - `getNewWardsByNameAndProvince(wardName: string, provinceName: string): Promise<NewWard[]>`

**2. utils/ward-lookup.ts**
- Added corresponding service layer methods:
  - `findNewWardsByName(wardName: string): Promise<NewWard[]>`
  - `findNewWardsByNameAndProvince(wardName: string, provinceName: string): Promise<NewWard[]>`

#### Technical Implementation
- Used IndexedDB compound indices for efficient multi-field queries
- Maintained existing database schema compatibility
- Followed TypeScript strict typing throughout
- Implemented proper error handling and null checks

#### Benefits
- Enables fast ward lookups by name alone
- Supports disambiguation through ward name + province combination
- Improves query performance for Vietnamese administrative data
- Maintains backward compatibility with existing code

#### Testing Notes
- No errors encountered during implementation
- All TypeScript types properly defined
- Database upgrade logic tested for new store creation

---

## Completed: Vietnamese Text Normalization for Database Search

### Task: Implement Normalized Search Indices
**Date**: Current session completion
**Status**: ✅ Complete

#### Requirements
- Add normalized index fields (`ward_index`, `district_index`, `province_index`) to all database interfaces
- Update IndexedDB schema to use normalized fields for search indices
- Modify data setup to populate normalized fields using `normalizeStr()` function
- Update ward lookup service with normalized search methods
- Maintain database version 1 (no migration needed)

#### Files Modified

**1. utils/indexeddb.ts**
- Added normalized index fields to interfaces:
  ```typescript
  export interface OldWard {
    ward_code: string;
    ward_name: string;
    ward_index: string;        // NEW: normalized ward name
    district_name: string;
    district_index: string;    // NEW: normalized district name
    province_name: string;
    province_index: string;    // NEW: normalized province name
  }
  ```
- Updated IndexedDB schema to use normalized indices:
  ```typescript
  old_wards: {
    indexes: {
      ward_index: string;                                    // Changed from ward_name
      district_index: string;                                // Changed from district_name
      province_index: string;                                // Changed from province_name
      ward_district_province_index: [string, string, string]; // Now uses normalized fields
    };
  };
  ```
- Added query methods for normalized searches:
  - `getOldWardsByName(wardName: string): Promise<OldWard[]>`
  - `getOldWardsByDistrict(districtName: string): Promise<OldWard[]>`
  - `getOldWardsByProvince(provinceName: string): Promise<OldWard[]>`
  - `getOldWardsByFullAddress(wardName: string, districtName: string, provinceName: string): Promise<OldWard[]>`

**2. utils/data-setup.ts**
- Added `normalizeStr` import and usage
- Updated data transformation to populate normalized fields:
  ```typescript
  const oldWards: OldWard[] = oldWardsData.map((row) => ({
    ward_code: row.ward_code,
    ward_name: row.ward_name,
    ward_index: normalizeStr(row.ward_name),      // NEW
    district_name: row.district_name,
    district_index: normalizeStr(row.district_name), // NEW
    province_name: row.province_name,
    province_index: normalizeStr(row.province_name), // NEW
  }));
  ```

**3. utils/ward-lookup.ts**
- Updated existing methods to use normalized search parameters:
  ```typescript
  async findOldWardsByName(wardName: string): Promise<OldWard[]> {
    await this.init();
    const normalizedWardName = normalizeStr(wardName);
    return this.db!.getOldWardsByName(normalizedWardName);
  }
  ```
- Added new normalized search methods for all administrative levels

#### Technical Implementation
- Leveraged existing `normalizeStr()` function for Vietnamese text normalization
- Removed diacritics and handled đ/Đ → d/D conversion for accurate search
- Used IndexedDB compound indices for efficient multi-field queries
- Maintained proper service layer abstraction between `WardLookupService` and `VietnamAdminDB`
- Kept database version at 1 to avoid unnecessary migrations

#### Architectural Fixes
- Resolved initial confusion about database access patterns
- Ensured `WardLookupService` calls methods on `VietnamAdminDB` instance rather than accessing IndexedDB directly
- Added missing query methods to `VietnamAdminDB` class for proper abstraction
- Fixed inconsistent database access by using service layer pattern consistently

#### Benefits
- Enables accurate Vietnamese text search regardless of diacritics or case
- Improves search performance through proper indexing on normalized fields
- Supports fuzzy matching for Vietnamese administrative unit names
- Maintains clean architectural separation between database and service layers
- Backward compatible with existing code structure

#### Issues Resolved
1. **Method placement**: Initially added methods to wrong layer, fixed by placing database methods in `VietnamAdminDB` and service methods in `WardLookupService`
2. **Database versioning**: Reverted version increment per user request since extension not yet released
3. **Access pattern inconsistency**: Fixed improper direct database access by ensuring consistent use of service layer abstraction

---

## Completed: Province Data Stores Integration

### Task: Add Province Data Support for Hierarchical Lookups
**Date**: Session completion
**Status**: ✅ Complete

#### Requirements
- Add 2 new data stores: `new_provinces.csv` and `old_provinces.csv`
- Enable quick retrieval of province lists (new or old)
- Allow getting districts by province name (for old provinces) or wards by province name (for new provinces)
- Enable getting old wards by district and province combination
- Use combo index keys on old_wards to avoid creating a separate districts CSV
- Maintain the same DB version without requiring migrations

#### Files Modified

**1. utils/indexeddb.ts**
- Added new province interfaces:
  ```typescript
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
  ```
- Updated database schema with new stores:
  ```typescript
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
  ```
- Added combo index for efficient district lookup:
  ```typescript
  old_wards: {
    indexes: {
      district_province_index: [string, string]; // NEW: [district_index, province_index]
    };
  };
  ```
- Added hierarchical query methods:
  - `getAllNewProvinces(): Promise<NewProvince[]>`
  - `getAllOldProvinces(): Promise<OldProvince[]>`
  - `getDistrictsByProvince(provinceName: string): Promise<string[]>`
  - `getOldWardsByDistrictAndProvince(districtName: string, provinceName: string): Promise<OldWard[]>`
  - Province lookup methods with normalization support

**2. utils/data-setup.ts**
- Updated imports to include province interfaces
- Added province CSV loading to Promise.all:
  ```typescript
  const [oldWardsData, newWardsData, wardMappingsData, newProvincesData, oldProvincesData] = await Promise.all([
    this.loadCSVFile('/data/old_wards.csv'),
    this.loadCSVFile('/data/new_wards.csv'),
    this.loadCSVFile('/data/ward_mappings.csv'),
    this.loadCSVFile('/data/new_provinces.csv'),    // NEW
    this.loadCSVFile('/data/old_provinces.csv'),    // NEW
  ]);
  ```
- Added province data transformation with normalization:
  ```typescript
  const newProvinces: NewProvince[] = newProvincesData.map((row) => ({
    code: row.code,
    name: row.name,
    name_index: normalizeStr(row.name),
    letter_code: row.letter_code,
    type: row.type,
    alias: row.alias,
  }));
  ```
- Added province data insertion to bulk operations

#### Technical Implementation
- Designed hierarchical data access pattern using combo indexes
- Implemented efficient district lookup without requiring separate CSV files
- Added proper upgrade logic to handle new indexes on existing databases
- Used normalized string matching for Vietnamese province names
- Maintained backward compatibility by not changing the DB version

#### Data Structure Analysis
- **New Provinces CSV**: Contains code, name, letter_code, type, alias (35 provinces)
- **Old Provinces CSV**: Contains code, name, type, alias (64 provinces)
- Leveraged existing ward data for district information via combo indexing

#### Hierarchical Query Capabilities
1. **Province Level**: Get all new/old provinces
2. **District Level**: Get districts by province name (using combo index on old_wards)
3. **Ward Level**: Get wards by province (new) or by district+province (old)
4. **Cross-Reference**: Direct province lookup by code or normalized name

#### Benefits
- Enables complete administrative hierarchy navigation
- Supports both old (64 provinces) and new (35 provinces) administrative structures
- Provides efficient district lookup without additional data files
- Maintains data consistency through normalized string matching
- Supports Vietnamese text search with diacritic normalization

---

## Completed: Unit Testing Setup

### Task: Add Vitest unit tests
**Date**: 2026-03-07
**Status**: ✅ Complete

#### What was added
- `vitest` and `fake-indexeddb` as dev dependencies
- `vitest.config.ts` — config pointing to setup file
- `tests/setup.ts` — loads `fake-indexeddb/auto`
- `tests/normalizeStr.test.ts` — 7 tests for pure normalization function
- `tests/csv-parser.test.ts` — 9 tests (quoting, escaping, column mismatch, real CSV formats)
- `tests/indexeddb.test.ts` — 18 tests (CRUD + index queries on all stores)
- `tests/ward-lookup.test.ts` — 22 tests (all `WardLookupService` methods)

#### Key pattern
DB isolation between tests: reset `global.indexedDB = new IDBFactory()` in `beforeEach`.
Seed data via a direct `VietnamAdminDB` instance; service under test shares the same fresh DB.

#### Scripts
- `pnpm test` — single run
- `pnpm test:watch` — watch mode

---

---

## Completed: Popup UI with Quick Search

### Task: Implement lookup popup with quick search inputs
**Date**: 2026-03-07
**Status**: ✅ Complete

#### What was added

**Popup UI (Choices.js select inputs)**
- "Mới → Cũ" tab: province + ward selects, results with copy buttons
- "Cũ → Mới" tab: province + district + ward selects, results with copy buttons
- "Giới thiệu" tab: about section

**Quick search for both tabs**
- Text input at the top of each lookup tab with debounced search (200ms)
- Comma-separated parts: ward[, province] for new; ward[, district][, province] for old
- Prefix-stripping: users can omit Phường/Xã/Thị trấn, Quận/Huyện/Thị xã, Tỉnh/Thành phố
- Diacritic-insensitive: users can type without Vietnamese tone marks
- Keyboard navigation (Arrow keys, Enter, Escape) and click-outside-to-close
- On candidate selection, auto-fills the formal select inputs and shows results
- Help popover (?) icon explaining input format with examples

**New DB/service methods**
- `searchNewWards(query, provinceQuery?)` — prefix match on ward_index with auto-prepend of ward prefixes
- `searchOldWards(query, districtQuery?, provinceQuery?)` — same with district prefix support

#### Files Modified
- `utils/indexeddb.ts` — added `searchNewWards` and `searchOldWards` methods
- `utils/ward-lookup.ts` — added service layer wrappers
- `entrypoints/popup/index.html` — quick search inputs, help buttons, dividers
- `entrypoints/popup/main.ts` — search logic, dropdown rendering, candidate selection, help popovers
- `entrypoints/popup/style.css` — quick search, dropdown, help popover, divider styles (light + dark)

---

#### Usage Examples
```typescript
// Get all provinces
const newProvinces = await db.getAllNewProvinces();
const oldProvinces = await db.getAllOldProvinces();

// Get districts within a province
const districts = await db.getDistrictsByProvince("Hà Nội");

// Get wards by province (new structure)
const wards = await db.getNewWardsByProvince("Hà Nội");

// Get wards by district and province (old structure)
const oldWards = await db.getOldWardsByDistrictAndProvince("Ba Đình", "Hà Nội");
```