# Development Guide

## Build Commands

```bash
yarn build          # Build for production (removes console.log/warn)
yarn build:main     # Build main app + content script
yarn build:injected # Build injection scripts from TypeScript
yarn start          # Dev server with hot reload
yarn test           # Run tests in watch mode
yarn test:run       # Run tests once
yarn test:coverage  # Run tests with coverage
yarn typecheck      # Type checking only
```

## Architecture

The extension uses a **modular, feature-based architecture**. See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation.

### High-Level Structure

```
src/
├── core/                    # Infrastructure (state, events, storage)
├── platform/               # Platform adapters (DOM, Chrome APIs)
├── features/               # Feature modules (sorting, favorites, tableView)
├── content/                # Content script orchestration
└── popup/                  # React UI components
```

### TypeScript-First Build Pipeline

All code is written in TypeScript and compiled by Vite:

**Build outputs:**
- `dist/main.js` - React popup
- `dist/content.js` - Content script
- `dist/background.js` - Background script
- `dist/injected-scripts/` - Injected scripts for page context

### Console Log Removal

Terser automatically removes `console.log()` and `console.warn()` in production builds.
`console.error()` is preserved for production debugging.

Configured in `vite.config.ts`:
```typescript
terserOptions: {
  compress: {
    drop_console: ['log', 'warn'],
  },
}
```

## Making Changes

### Adding a New Feature

1. Create feature directory in `src/features/yourFeature/`
2. Create type definitions: `yourFeature.types.ts`
3. Create orchestrator: `YourFeatureOrchestrator.ts`
4. Add to `ContentOrchestrator.ts` to initialize
5. Add message handler in `MessageHandler.ts`
6. Create UI component in `popup/features/`

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed guidelines.

### Modifying Existing Features

**Sorting** (`src/features/sorting/`)
- Pure logic: `TileSorter.ts`
- Data extraction: `TileDataExtractor.ts`
- Orchestration: `SortOrchestrator.ts`

**Favorites** (`src/features/favorites/`)
- Storage: `FavoritesStore.ts`
- Star buttons: `StarButton.ts`
- Injection: `StarInjector.ts` ⚡ (performance-critical)
- Watching: `TilesWatcher.ts` ⚡ (performance-critical)

**Table View** (`src/features/tableView/`)
- Rendering: `TableRenderer.ts`
- Overlay: `TileOverlayManager.ts` ⚠️ (critical - don't break clicks!)
- Controller: `TableViewController.ts`

### Performance Considerations

When modifying favorites injection:
- Don't add async calls inside loops
- Maintain batch processing (requestAnimationFrame)
- Keep cache TTL at 10s
- Use Set-based lookups for O(1) performance

## Testing

### Unit Tests
- Located in `src/**/__tests__/`
- Run with `yarn test` or `yarn test:run`
- Coverage with `yarn test:coverage`

### Manual Testing
1. Run `yarn build`
2. Open Chrome → `chrome://extensions/`
3. Load unpacked from `dist/` folder
4. Test on `https://capitaloneoffers.com/feed`

## File Structure

```
/
├── src/                      # TypeScript source code
│   ├── core/                # Infrastructure (state, events, storage)
│   ├── platform/            # Platform adapters (DOM, Chrome APIs)
│   ├── features/            # Feature modules (sorting, favorites, tableView)
│   ├── content/             # Content script orchestration
│   ├── popup/               # React UI components
│   ├── background/          # Background script
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper functions
├── public/                   # Static assets
│   ├── manifest.json        # Extension manifest
│   └── icons/               # Extension icons
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md      # Architecture guide
│   ├── DEVELOPMENT.md       # Developer guide (this file)
│   ├── PRIVACY.md           # Privacy policy
│   └── MANUAL_TESTING.md    # Testing procedures
├── dist/                     # Build output (git-ignored)
├── README.md                 # User-facing documentation
└── TESTING_GUIDE.md          # Testing guide for refactored extension
```

## Git Workflow

Files to commit:
- ✅ `src/` - All source code
- ✅ `public/` - Manifest and icons
- ✅ `docs/` - Documentation (ARCHITECTURE, DEVELOPMENT, PRIVACY, etc.)
- ✅ `README.md` - User-facing documentation
- ✅ `TESTING_GUIDE.md` - Testing guide
- ✅ Configuration files (package.json, vite.config.ts, tsconfig.json, etc.)

Files to ignore (see .gitignore):
- ❌ `dist/` - Build output
- ❌ `node_modules/` - Dependencies
- ❌ `coverage/` - Test coverage
- ❌ `REFACTOR_*.md` - Temporary refactoring docs
- ❌ `*.log` - Log files
- ❌ `.DS_Store` - macOS metadata

## Recent Performance Optimizations

### Favorites Star Injection (Latest)

**Problem:** Star injection was slow (~500ms for 50 tiles) due to sequential async storage calls.

**Solution:**
- Batch load all favorites once (1 storage call instead of N)
- Use Set-based lookups (O(1) instead of async calls)
- Process tiles in batches of 10 using requestAnimationFrame
- Reduced scan intervals from 8 to 4

**Result:** ~10x faster (~50ms for 50 tiles)

**Modified Files:**
- `src/features/favorites/StarInjector.ts`
- `src/features/favorites/TilesWatcher.ts`

See [ARCHITECTURE.md](ARCHITECTURE.md) for implementation details.
