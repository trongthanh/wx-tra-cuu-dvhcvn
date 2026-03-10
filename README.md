# Phường Mới Quận Cũ — Vietnam Administrative Units Lookup Extension

A browser extension to look up Vietnam's new and old administrative unit names after the 2025 reform that merged 63 provinces into 34 and removed the district level.

## Features

- **Mới → Cũ**: Look up old wards/districts/provinces from new ward names
- **Cũ → Mới**: Look up new wards/provinces from old ward/district/province names
- **Quick Search**: Type-ahead search with diacritic-insensitive matching and prefix omission (e.g. type `An Hoi Tay, Ho Chi Minh` instead of `Phường An Hội Tây, Thành phố Hồ Chí Minh`)
- **Content Annotation**: Automatically highlights new ward names on web pages with dotted underlines and `[?]` hints. Hover to see the old district(s) and province(s) in a tooltip.

## Tech Stack

- [WXT](https://wxt.dev/) (Web eXTension Toolkit) — Manifest V3 (Chrome) / V2 (Firefox)
- TypeScript (strict mode)
- IndexedDB via [idb](https://github.com/nicolo-ribaudo/idb) for local data storage
- [Choices.js](https://github.com/Choices-js/Choices) for searchable select inputs
- [Vitest](https://vitest.dev/) + [fake-indexeddb](https://github.com/nicolo-ribaudo/fake-indexeddb) for testing

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server (Chrome)
pnpm dev

# Start dev server (Firefox)
pnpm dev:firefox
```

## Build

```bash
# Build for Chrome
pnpm build

# Build for Firefox
pnpm build:firefox

# Create distributable zip
pnpm zip          # Chrome
pnpm zip:firefox  # Firefox
```

## Testing

```bash
pnpm test         # Single run
pnpm test:watch   # Watch mode
```

## Project Structure

```
entrypoints/              # Extension entry points
├── background.ts         # Data initialization on install/update
├── ward-annotation.content.ts  # Content script for page annotation
└── popup/                # Browser action popup UI
    ├── index.html
    ├── main.ts
    └── style.css

utils/                    # Core utilities
├── indexeddb.ts          # IndexedDB schema and queries
├── ward-lookup.ts        # Ward lookup service layer
├── data-setup.ts         # CSV loading and DB population
├── csv-parser.ts         # CSV parsing
├── normalizeStr.ts       # Vietnamese diacritic normalization
└── settings.ts           # Extension settings management

data/                 # Administrative unit CSV data
├── old_wards.csv     # Pre-reform wards (ward/district/province)
├── new_wards.csv     # Post-reform wards (ward/province)
├── ward_mappings.csv # Old ↔ new ward code mappings
├── old_provinces.csv # Pre-reform provinces (63)
└── new_provinces.csv # Post-reform provinces (34)

tests/                # Unit tests
```

## License

MIT
