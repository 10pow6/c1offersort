# Architecture Documentation

## Overview

C1 Offers Sorter is built with a **modular, feature-based architecture** designed for maintainability, extensibility, and performance. The codebase is organized into clear layers with explicit dependencies and event-driven communication.

## Design Principles

1. **Single Responsibility**: Each module has one clear purpose
2. **Type Safety**: Full TypeScript coverage with strict typing
3. **Event-Driven**: Features communicate via typed event bus to minimize coupling
4. **Performance First**: Batched DOM operations, caching, and requestAnimationFrame scheduling
5. **Security**: Input validation and sanitization throughout

## Directory Structure

```
src/
├── core/                          # Infrastructure layer (~1,200 lines)
│   ├── state/                     # Observable state management
│   │   ├── StateManager.ts        # Centralized state store
│   │   ├── FavoritesState.ts      # Favorites state slice
│   │   └── ViewModeState.ts       # View mode state slice
│   ├── events/                    # Type-safe event system
│   │   └── events.types.ts        # Event definitions and bus
│   └── storage/                   # Storage abstraction
│       └── FavoritesStore.ts      # Chrome storage wrapper
│
├── platform/                      # Platform adapters (~700 lines)
│   ├── dom/                       # DOM operations
│   │   ├── DOMQueries.ts          # Element queries and searches
│   │   └── TileExtractor.ts      # Extract data from tiles
│   ├── chrome/                    # Chrome API wrappers
│   │   ├── MessagingAdapter.ts   # Type-safe messaging
│   │   ├── StorageAdapter.ts     # Storage operations
│   │   └── TabsAdapter.ts        # Tab management
│   └── validation/                # Data validation
│       ├── TileValidator.ts      # Tile data validation
│       └── SecurityValidator.ts  # Security checks
│
├── features/                      # Feature modules (~2,500 lines)
│   ├── sorting/                   # Sorting feature
│   │   ├── sorting.types.ts      # Type definitions
│   │   ├── TileSorter.ts         # Pure sorting logic
│   │   ├── TileDataExtractor.ts  # Extract sortable data
│   │   └── SortOrchestrator.ts   # Coordinate sorting
│   ├── tableView/                 # Table view feature
│   │   ├── tableView.types.ts    # Type definitions
│   │   ├── TableRenderer.ts      # Render table HTML
│   │   ├── TileOverlayManager.ts # Invisible overlay workaround
│   │   ├── TableViewController.ts # Table state and lifecycle
│   │   └── TableOrchestrator.ts  # Coordinate table view
│   └── favorites/                 # Favorites feature (RECENTLY OPTIMIZED)
│       ├── favorites.types.ts    # Type definitions
│       ├── FavoritesStore.ts     # Storage with caching
│       ├── StarButton.ts         # Star button UI
│       ├── StarInjector.ts       # ⚡ OPTIMIZED: Batch star injection
│       ├── FavoritesFilter.ts    # Filter favorited offers
│       ├── TilesWatcher.ts       # ⚡ OPTIMIZED: Watch for new tiles
│       └── FavoritesOrchestrator.ts # Coordinate favorites
│
├── content/                       # Content script (~300 lines)
│   ├── ContentOrchestrator.ts    # Central feature coordinator
│   ├── MessageHandler.ts         # Route messages to features
│   └── index.ts                  # Entry point
│
└── popup/                         # Popup UI (refactored)
    ├── App.tsx                   # Main app (146 lines, was 644)
    ├── features/                 # Feature components
    │   ├── sorting/              # Sorting controls
    │   ├── viewMode/             # View mode toggle
    │   └── favorites/            # Favorites controls
    ├── hooks/                    # Custom hooks
    │   ├── useSortOffers.ts     # Sorting state
    │   ├── useFavorites.ts      # Favorites state
    │   ├── useFavoritesControls.ts
    │   └── useViewMode.ts       # View mode state
    └── components/               # Reusable UI components
```

## Core Modules

### State Management (`core/state/`)

**Observable state slices** with type-safe updates and subscriptions.

```typescript
// Example: FavoritesState
class FavoritesState {
  private state: FavoritesStateData;
  private listeners: Set<StateListener>;

  subscribe(listener: StateListener): () => void
  getState(): FavoritesStateData
  setState(updates: Partial<FavoritesStateData>): void
}
```

**Benefits:**
- Centralized state management
- Type-safe updates
- Reactive UI updates
- No prop drilling

### Event System (`core/events/`)

**Type-safe event bus** for feature communication.

```typescript
// Emit events
await emitEvent({ type: 'FAVORITES_ENABLED' });

// Listen to events
onEvent('FAVORITES_ENABLED', async (event) => {
  // Handle event
});
```

**Benefits:**
- Decouples features
- Type-safe event payloads
- Async event handlers
- Easy debugging

### Storage (`core/storage/`)

**Abstraction over Chrome storage** with write-through caching.

```typescript
// FavoritesStore
const store = new ChromeStorageStore<FavoriteData>('c1-favorites-v2');
await store.load();
store.set(merchantTLD, favoriteData);
const favorite = store.get(merchantTLD);
```

**Benefits:**
- Consistent API
- Automatic caching
- Type safety
- Easy to mock for testing

## Feature Modules

### Sorting Feature (`features/sorting/`)

**Pure sorting logic** separated from DOM manipulation.

**Flow:**
1. `SortOrchestrator` receives sort request
2. `TileDataExtractor` extracts data from tiles
3. `TileSorter` performs pure sorting logic
4. Results are applied to DOM

**Key Files:**
- `TileSorter.ts`: Pure sorting functions (no DOM)
- `TileDataExtractor.ts`: Extract merchant/mileage data
- `SortOrchestrator.ts`: Coordinate the flow

### Table View Feature (`features/tableView/`)

**Custom table rendering** with invisible overlay workaround.

**The Secret Sauce (Invisible Overlay):**
- Original offer tiles positioned as invisible overlays over table rows
- User sees custom table UI, clicks are captured by invisible tiles
- Capital One's modal handlers continue to work perfectly
- **Location**: `TileOverlayManager.ts`

**Flow:**
1. `TableOrchestrator` receives enable request
2. `TableRenderer` generates table HTML
3. `TileOverlayManager` positions invisible tiles
4. `TableViewController` manages lifecycle

**Key Files:**
- `TableRenderer.ts`: Generate table HTML from tile data
- `TileOverlayManager.ts`: ⚠️ CRITICAL - Invisible overlay positioning
- `TableViewController.ts`: Table state and event handling

### Favorites Feature (`features/favorites/`) ⚡ RECENTLY OPTIMIZED

**Star-based favorites** with filtering and persistence.

**Recent Performance Optimizations:**
- ✅ **Batch storage loading**: Load all favorites once instead of per-tile
- ✅ **Set-based lookups**: O(1) favorite checks instead of async storage calls
- ✅ **requestAnimationFrame batching**: Process tiles in chunks to avoid blocking UI
- ✅ **Reduced scan intervals**: Fewer MutationObserver scans (8 → 4 scans)
- ✅ **Deduplicated nodes**: Avoid processing same DOM nodes multiple times

**Flow:**
1. User toggles favorites → `FavoritesOrchestrator.enableFavorites()`
2. `StarInjector` loads all favorites once (cached)
3. `StarInjector` injects stars in batches of 10 using requestAnimationFrame
4. `TilesWatcher` monitors for new tiles and auto-injects stars
5. User clicks star → `StarButton` toggles favorite state
6. `FavoritesFilter` shows/hides tiles based on favorite status

**Key Files:**
- `StarInjector.ts`: ⚡ **OPTIMIZED** - Batch star injection with caching
- `TilesWatcher.ts`: ⚡ **OPTIMIZED** - Efficient tile monitoring
- `FavoritesStore.ts`: Storage operations with 10s cache TTL
- `StarButton.ts`: Star button creation and event handling
- `FavoritesFilter.ts`: Filter tiles by favorite status

**Performance Metrics:**
- **Before**: 50 tiles × 50 async storage calls = ~500ms+ (sequential)
- **After**: 1 storage call + 50 Set lookups = ~50ms (batched)
- **Improvement**: ~10x faster star injection

## Content Script Orchestration

### ContentOrchestrator (`content/ContentOrchestrator.ts`)

**Central coordinator** for all features in content script context.

**Responsibilities:**
- Initialize feature modules
- Listen to cross-feature events
- Coordinate feature interactions
- Handle cleanup

**Example:**
```typescript
// Initialize favorites
initializeFavorites();

// Listen for events
onEvent('FAVORITES_ENABLED', async () => {
  // Update UI, notify other features
});
```

### MessageHandler (`content/MessageHandler.ts`)

**Routes messages** from popup to appropriate feature handlers.

**Flow:**
1. Popup sends message via `MessageBus.sendToTab()`
2. `MessageHandler` receives message in content script
3. Routes to appropriate feature (sorting, table view, favorites)
4. Returns response to popup

## Popup UI

### Feature-Based Components (`popup/features/`)

**Modular UI components** for each feature:
- `sorting/SortingControls.tsx`: Sort criteria and order selectors
- `viewMode/ViewModeControls.tsx`: Grid/table toggle
- `favorites/FavoritesControls.tsx`: Favorites toggle, filter, list

**Benefits:**
- Easy to test individual features
- Clear separation of concerns
- Reusable components

### Custom Hooks (`popup/hooks/`)

**State management hooks** that bridge Chrome APIs and React:
- `useSortOffers.ts`: Sorting state and actions
- `useFavorites.ts`: Favorites state and actions
- `useViewMode.ts`: View mode state and actions

## Performance Optimizations

### DOM Operations
- **Batched reads/writes**: Avoid layout thrashing
- **requestAnimationFrame**: Schedule DOM updates efficiently
- **Content-visibility**: Browser skips rendering off-screen content

### Caching
- **WeakMap for tile data**: Automatic garbage collection
- **10s cache TTL for favorites**: Reduce storage reads
- **Container caching**: Reduce repeated DOM queries

### Star Injection (Recent Optimization)
- **Single storage load**: Load all favorites once per batch
- **Set-based lookups**: O(1) favorite checks
- **Batched processing**: 10 tiles per requestAnimationFrame
- **Deduplication**: Skip already-processed tiles

### Mutation Observer
- **300ms debounce**: Prevent excessive processing
- **Reduced scans**: 4 intervals instead of 8
- **Cleanup checks**: Skip processing if disabled

## Security

### Input Validation
- All user input sanitized before storage
- HTML tags stripped from merchant names
- Max length limits on all strings

### XSS Prevention
- No `eval()` or `innerHTML` with user data
- All dynamic content uses textContent or typed DOM APIs

### Content Security Policy
- Manifest V3 compliant
- No remote code execution
- Minimal permissions (activeTab, scripting, storage)

## Testing Strategy

### Unit Tests
- Pure functions (sorting, data extraction)
- Utilities (validation, sanitization)
- **Location**: `src/**/__tests__/`

### Integration Tests
- Feature orchestrators
- Message handling
- State management

### Manual Testing
- Load extension in Chrome
- Test all features on Capital One page
- Verify invisible overlay clicks work
- Check console for errors

## Making Changes

### Adding a New Feature

1. **Create feature directory**: `src/features/yourFeature/`
2. **Define types**: `yourFeature.types.ts`
3. **Create orchestrator**: `YourFeatureOrchestrator.ts`
4. **Add to ContentOrchestrator**: Import and initialize
5. **Add message handler**: Route messages in `MessageHandler.ts`
6. **Create UI**: Add component in `popup/features/`

### Modifying Favorites (Recently Optimized)

⚠️ **Performance-critical areas:**
- `StarInjector.ts:72-121` - Batch injection logic
- `TilesWatcher.ts:60-100` - Scan intervals and batching
- `FavoritesStore.ts:52-78` - Cache TTL and storage calls

**Don't:**
- Add async calls inside loops (use batch loading)
- Increase scan frequency (performance impact)
- Skip caching (causes repeated storage reads)

**Do:**
- Maintain batch processing with requestAnimationFrame
- Keep favorites cache TTL at 10s
- Use Set-based lookups for O(1) performance

### Modifying Table View

⚠️ **CRITICAL: Invisible Overlay Workaround**
- **Location**: `TileOverlayManager.ts`
- **Don't modify** positioning logic without extensive testing
- **Test**: Clicks in table view must open Capital One modals

## Troubleshooting

### Stars Don't Appear
- Check storage: `chrome.storage.local.get('c1-favorites-enabled')`
- Verify favorites initialized: Look for console logs
- Check for errors in `StarInjector`

### Table View Clicks Don't Work
- Verify invisible tiles have `position: absolute`
- Check `z-index: 5` and `opacity: 0`
- Ensure `pointer-events: auto`

### Performance Issues
- Check console for excessive logs
- Verify cache TTLs are respected
- Look for repeated storage calls

## Module Size Guidelines

- **Target**: <200 lines per module
- **Max**: <300 lines (hard limit)
- **Current Average**: ~120 lines

**Largest Modules:**
- `TableViewController.ts`: 280 lines
- `TilesWatcher.ts`: 224 lines
- `StarInjector.ts`: 170 lines

## Conclusion

This architecture provides:
- ✅ **Maintainability**: Small, focused modules
- ✅ **Extensibility**: Easy to add new features
- ✅ **Performance**: Optimized for speed
- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **Testability**: Pure functions, clear boundaries
- ✅ **LLM-Friendly**: Modules fit in context windows

The recent favorites optimization demonstrates the architecture's flexibility - performance improvements were isolated to 2 files without affecting other features.
