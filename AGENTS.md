# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WebExtension project built with WXT (Web eXTension Toolkit) and TypeScript. The extension targets both Chrome and Firefox browsers and includes a popup interface, content script, and background script.

**Purpose**: Vietnam Administrative Units Lookup Extension - helps users identify updated administrative unit names (wards, districts, provinces) in Vietnam by providing tooltips and augmented content on web pages.

## Development Commands

- `pnpm dev` - Start development server for Chrome
- `pnpm dev:firefox` - Start development server for Firefox  
- `pnpm build` - Build extension for Chrome
- `pnpm build:firefox` - Build extension for Firefox
- `pnpm zip` - Create distributable zip for Chrome
- `pnpm zip:firefox` - Create distributable zip for Firefox
- `pnpm compile` - Type check without emitting files
- `pnpm postinstall` - Prepare WXT environment (runs automatically after install)

## Architecture

### Entry Points
The extension follows WXT's convention-based architecture with three main entry points:

- **Background Script** (`entrypoints/background.ts`) - Service worker/background page using `defineBackground()`
- **Content Script** (`entrypoints/content.ts`) - Injected into web pages using `defineContentScript()` with URL patterns
- **Popup** (`entrypoints/popup/`) - Browser action popup with HTML/CSS/TypeScript

### Project Structure
```
entrypoints/          # Extension entry points
├── background.ts     # Background/service worker script with data initialization
├── content.ts        # Content script that augments web pages with ward info
└── popup/            # Popup UI
    ├── index.html    # Popup HTML template
    ├── main.ts       # Popup TypeScript entry
    └── style.css     # Popup styles

utils/               # Core utilities
├── data-setup.ts    # Data initialization and version management
├── indexeddb.ts     # IndexedDB wrapper for local data storage
├── ward-lookup.ts   # Ward lookup service with search functionality
├── csv-parser.ts    # CSV parsing utilities
└── normalizeStr.ts  # String normalization for Vietnamese text

data/                # Administrative unit data
├── old_wards.csv    # Pre-reform ward data
├── new_wards.csv    # Post-reform ward data
├── ward_mappings.csv # Ward transformation mappings
└── ward_mappings.json # JSON version of mappings

components/           # Reusable components
├── counter.ts        # Counter component logic

assets/              # Static assets
├── typescript.svg   # TypeScript logo

public/              # Public assets
├── icon/           # Extension icons
├── data/           # Web-accessible data files
└── wxt.svg         # WXT logo
```

### Configuration
- **TypeScript**: Configured through `.wxt/tsconfig.json` with strict mode enabled
- **Path Aliases**: `@` and `~` map to project root for imports
- **Module System**: ESNext with bundler module resolution
- **WXT Config**: Configured with web accessible resources for CSV data files
- **Dependencies**: Uses `idb` library for IndexedDB operations

### Content Script Implementation
- **Targeting**: Configured to inject into all URLs (`<all_urls>`) to detect Vietnamese administrative unit names
- **Functionality**: Scans web page text for old administrative unit names and provides tooltips with updated names
- **Text Augmentation**: Creates clickable links with dotted underlines for discovered administrative units

### Data Management
- **Storage**: Uses IndexedDB for local storage of administrative unit data
- **Versioning**: Implements data versioning system to update when CSV files change
- **Initialization**: Background script automatically loads and updates data on extension install/update
- **Lookup Service**: Provides bidirectional lookup between old and new administrative units

### Build Output
- Development builds go to `.output/chrome-mv3-dev/` or `.output/firefox-mv2-dev/`
- Production builds create optimized extension packages
- ZIP commands create distributable extension files

## Development Notes

- Use `pnpm` as the package manager
- The project uses Manifest V3 for Chrome and V2 for Firefox
- WXT handles cross-browser compatibility automatically
- All source files use TypeScript with strict mode enabled
- The extension includes both light and dark theme support in CSS
- Always read part of the data files (./data/**) since their number of lines are very large

## Data Structure

### CSV Files

#### old_wards.csv
Pre-reform ward data with hierarchical administrative structure.
```
ward_code,ward_name,district_name,province_name
"26881","Phường 12","Quận Gò Vấp","Thành phố Hồ Chí Minh"
```

#### new_wards.csv
Post-reform ward data (districts merged into provinces).
```
ward_code,ward_name,province_name
"26882","Phường An Hội Tây","Thành phố Hồ Chí Minh"
```

#### ward_mappings.csv
Mapping between old and new ward codes (many-to-many relationship).
```
new_ward_code,old_ward_code
"26882","26881"
```

#### new_provinces.csv
Post-reform province data.
```
code,name,letter_code,type,alias
"01","Thành phố Hà Nội","HNI","Thành phố Trung Ương",""
```

#### old_provinces.csv
Pre-reform province data.
```
code,name,type,alias
"01","Thành phố Hà Nội","Thành phố Trung ương","Hà Nội,HN,Tp. Hà Nội"
```

### IndexedDB Schema

#### Object Stores

**old_wards** (keyPath: `ward_code`)
- Stores pre-reform ward data with district hierarchy
- Indexes:
  - `ward_index`: ward_index (normalized ward name)
  - `district_index`: district_index (normalized district name)
  - `province_index`: province_index (normalized province name)
  - `ward_district_province_index`: [ward_index, district_index, province_index]
  - `district_province_index`: [district_index, province_index]
  - `province_district`: [province_name, district_name] (for efficient unique district lookup)

**new_wards** (keyPath: `ward_code`)
- Stores post-reform ward data (no district level)
- Indexes:
  - `ward_index`: ward_index (normalized ward name)
  - `province_index`: province_index (normalized province name)
  - `ward_province_index`: [ward_index, province_index]

**new_provinces** (keyPath: `code`)
- Stores post-reform province data
- Indexes:
  - `name_index`: name_index (normalized province name)
  - `letter_code`: letter_code

**old_provinces** (keyPath: `code`)
- Stores pre-reform province data
- Indexes:
  - `name_index`: name_index (normalized province name)

**ward_mappings** (autoIncrement key)
- Stores many-to-many ward code mappings
- Indexes:
  - `old_ward_code`: old_ward_code
  - `new_ward_code`: new_ward_code

**version_info** (keyPath: `id`)
- Stores data version information
- Fields: `id`, `version`, `lastUpdated`

### TypeScript Interfaces

See `utils/indexeddb.ts` for complete type definitions:
- `OldWard`: ward_code, ward_name, ward_index, district_name, district_index, province_name, province_index
- `NewWard`: ward_code, ward_name, ward_index, province_name, province_index
- `NewProvince`: code, name, name_index, letter_code, type, alias
- `OldProvince`: code, name, name_index, type, alias
- `WardMapping`: new_ward_code, old_ward_code
- `VersionInfo`: version, lastUpdated


## Implementation Details

### Background Script Features
- Initializes data setup on extension install/update
- Manages data versioning and automatic updates
- Exposes `wardLookup` service globally for testing (development)
- Handles extension lifecycle events

### Content Script Features
- Targets all URLs to detect Vietnamese administrative unit names
- Uses TreeWalker to scan text nodes efficiently
- Creates augmented links with tooltips for old administrative unit names
- Implements click handlers for enhanced user interaction

### Utility Services
- **DataSetup**: Manages CSV data loading and IndexedDB population
- **WardLookupService**: Provides search and mapping functionality
- **CSV Parser**: Handles CSV file parsing with proper encoding
- **String Normalization**: Normalizes Vietnamese text for accurate matching

### Key Technologies
- **IndexedDB**: Local storage for administrative unit data with versioning
- **TreeWalker API**: Efficient DOM text node traversal for content augmentation
- **CSV Processing**: Handles large datasets from Vietnamese government sources
- **Content Script Injection**: Real-time web page enhancement across all domains

## IMMEDIATE NOTES:

- There is no public release YET, therefore, do not change DB version as well as adding any DB migration condition. Treat DB schema as the very first one.
- For any field used as index, create a new colum `_index` processed with the normalizeStr function to remove any Vietnamese diacritics and change case to all lower.
