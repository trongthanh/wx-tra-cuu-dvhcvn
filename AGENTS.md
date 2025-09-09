# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WebExtension project built with WXT (Web eXTension Toolkit) and TypeScript. The extension targets both Chrome and Firefox browsers and includes a popup interface, content script, and background script.

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
├── background.ts     # Background/service worker script
├── content.ts        # Content script (currently targets google.com)
└── popup/            # Popup UI
    ├── index.html    # Popup HTML template
    ├── main.ts       # Popup TypeScript entry
    └── style.css     # Popup styles

components/           # Reusable components
├── counter.ts        # Counter component logic

assets/              # Static assets
├── typescript.svg   # TypeScript logo

public/              # Public assets
├── icon/           # Extension icons
└── wxt.svg         # WXT logo
```

### Configuration
- **TypeScript**: Configured through `.wxt/tsconfig.json` with strict mode enabled
- **Path Aliases**: `@` and `~` map to project root for imports
- **Module System**: ESNext with bundler module resolution
- **WXT Config**: Minimal setup in `wxt.config.ts`

### Content Script Targeting
Currently configured to inject into `*://*.google.com/*`. Update the `matches` array in `entrypoints/content.ts` to target different domains.

### Popup Architecture
The popup uses vanilla TypeScript with a simple counter component. The HTML template loads `main.ts` as a module, which sets up the UI and imports the counter logic from the components directory.

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
