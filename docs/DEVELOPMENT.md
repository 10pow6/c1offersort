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
```

## Architecture

### TypeScript-First Build Pipeline

All code is written in TypeScript and compiled by Vite:

```
src/
├── shared/                    # Shared utilities (single source of truth)
│   ├── domHelpers.ts         # DOM extraction functions
│   └── favoritesHelpers.ts   # Favorites storage functions
├── injected-scripts/shared/
│   ├── domHelpers.entry.ts   # Window exposure for injected context
│   └── favoritesHelpers.entry.ts
├── content.ts                # Content script (imports from shared/)
└── App.tsx                   # React popup UI
```

**Build outputs:**
- `dist/main.js` - React popup (164.77 KB)
- `dist/content.js` - Content script (6.86 KB)
- `dist/injected-scripts/shared/domHelpers.js` (3.51 KB)
- `dist/injected-scripts/shared/favoritesHelpers.js` (2.77 KB)

### No Code Duplication

Shared code is written once in `src/shared/` and automatically bundled for multiple contexts:
- Content script: Imports and bundles via Vite
- Injected scripts: Compiled to standalone ES modules

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

### Updating Shared Utilities

1. Edit TypeScript source in `src/shared/`
2. Run `yarn build`
3. Both content script and injection scripts automatically updated

### Adding New Features

1. Write code in TypeScript
2. Import shared utilities from `src/shared/`
3. Run tests with `yarn test`
4. Build with `yarn build`

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
│   ├── components/          # React UI components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # Business logic services
│   ├── shared/              # Shared utilities
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper functions
├── public/                   # Static assets
│   ├── manifest.json        # Extension manifest
│   └── icons/               # Extension icons
├── dist/                     # Build output (git-ignored)
├── CLAUDE.md                 # Internal documentation (git-ignored)
├── README.md                 # User-facing documentation
├── DEVELOPMENT.md            # Developer guide
├── MANUAL_TESTING.md         # Testing procedures
├── CHANGELOG.md              # Version history
└── PRIVACY.md                # Privacy policy
```

## Git Workflow

Files to commit:
- ✅ `src/` - All source code
- ✅ `public/` - Manifest and icons
- ✅ Documentation files (README, DEVELOPMENT, MANUAL_TESTING, CHANGELOG, PRIVACY)
- ✅ Configuration files (package.json, vite.config.ts, tsconfig.json, etc.)

Files to ignore (see .gitignore):
- ❌ `dist/` - Build output
- ❌ `node_modules/` - Dependencies
- ❌ `coverage/` - Test coverage
- ❌ `CLAUDE.md` - Internal documentation
- ❌ `*.log` - Log files
- ❌ `.DS_Store` - macOS metadata
