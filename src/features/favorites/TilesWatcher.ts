/**
 * Watches for new tiles and injects star buttons automatically
 * Replaces: src/content/modules/favorites/watcher.ts
 */

import { findAllTiles, findMainContainer } from '@/platform/dom/DOMQueries';
import { injectStarsIntoTiles } from './StarInjector';

const ENABLED_KEY = "c1-favorites-enabled";
const ENABLED_CACHE_TTL = 10000; // 10 seconds
// Reduced scan intervals - fewer scans, longer delays
const TILE_SCAN_INTERVALS = [100, 500, 1000, 2000];

interface WatcherCleanup {
  disableObserverOnly: () => void;
  cleanupAll: () => void;
}

/**
 * Check if tile should be excluded
 */
function shouldExcludeTile(tile: HTMLElement): boolean {
  // Skip tiles that already have stars
  if (tile.querySelector('.c1-favorite-star')) {
    return true;
  }
  return false;
}

/**
 * Setup tiles watcher with MutationObserver
 */
export function setupTilesWatcher(
  processedTiles: WeakMap<HTMLElement, boolean>
): WatcherCleanup {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let scanTimers: ReturnType<typeof setTimeout>[] = [];
  let isCleanedUp = false;

  // Cache enabled state
  let cachedEnabled = false;
  let enabledCacheTimestamp = 0;

  async function isEnabled(): Promise<boolean> {
    if (isCleanedUp) return false;
    const now = Date.now();
    if (now - enabledCacheTimestamp < ENABLED_CACHE_TTL) {
      return cachedEnabled;
    }
    try {
      const result = await chrome.storage.local.get(ENABLED_KEY);
      cachedEnabled = result[ENABLED_KEY] === true;
      enabledCacheTimestamp = now;
      return cachedEnabled;
    } catch (error) {
      return false;
    }
  }

  // Scan for initial tiles at intervals (handles slow-loading pages)
  const scanForInitialTiles = async () => {
    try {
      const enabled = await isEnabled();
      if (!enabled) return;

      let cumulativeTime = 0;
      for (const interval of TILE_SCAN_INTERVALS) {
        cumulativeTime += interval;

        const timer = setTimeout(async () => {
          try {
            const stillEnabled = await isEnabled();
            if (!stillEnabled || isCleanedUp) return;

            const allTiles = findAllTiles(true);
            const tilesToProcess: HTMLElement[] = [];

            // Batch check all tiles at once
            for (const tile of allTiles) {
              if (!processedTiles.has(tile) && !shouldExcludeTile(tile)) {
                tilesToProcess.push(tile);
                processedTiles.set(tile, true);
              }
            }

            if (tilesToProcess.length > 0) {
              // Batch inject - the function now handles favorites loading once
              await injectStarsIntoTiles(tilesToProcess);
            }
          } catch (error) {
            console.warn('[TilesWatcher] Error during delayed scan:', error);
          }
        }, cumulativeTime);

        scanTimers.push(timer);
      }
    } catch (error) {
      console.warn('[TilesWatcher] Error during initial scan:', error);
    }
  };

  scanForInitialTiles();

  // Setup MutationObserver
  const mainContainer = findMainContainer() || document.body;

  const observer = new MutationObserver((mutations) => {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = window.setTimeout(async () => {
      try {
        const enabled = await isEnabled();
        if (!enabled || isCleanedUp) {
          debounceTimer = null;
          return;
        }

        const tilesToProcess: HTMLElement[] = [];

        // Optimized: Build a Set of new nodes first to avoid duplicate checks
        const newNodes = new Set<HTMLElement>();
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLElement) {
              newNodes.add(node);
            }
          }
        }

        // Process unique nodes
        for (const node of newNodes) {
          // Check if node itself is a tile
          const isTileNode = node.hasAttribute("data-testid") &&
                             node.getAttribute("data-testid")?.startsWith("feed-tile-");

          if (isTileNode) {
            if (!processedTiles.has(node) && !shouldExcludeTile(node)) {
              tilesToProcess.push(node);
              processedTiles.set(node, true);
            }
          } else {
            // Check if node contains tiles
            const newTiles = Array.from(node.querySelectorAll('[data-testid^="feed-tile-"]')) as HTMLElement[];

            for (const tile of newTiles) {
              if (!processedTiles.has(tile) && !shouldExcludeTile(tile)) {
                tilesToProcess.push(tile);
                processedTiles.set(tile, true);
              }
            }
          }
        }

        if (tilesToProcess.length > 0) {
          console.log(`[TilesWatcher] Processing ${tilesToProcess.length} new tiles`);

          // Preserve scroll position
          const scrollX = window.scrollX;
          const scrollY = window.scrollY;
          await injectStarsIntoTiles(tilesToProcess);
          window.scrollTo(scrollX, scrollY);
        }

        debounceTimer = null;
      } catch (error) {
        debounceTimer = null;
        console.error('[TilesWatcher] Error in mutation handler:', error);
      }
    }, 300);
  });

  observer.observe(mainContainer, {
    childList: true,
    subtree: true,
  });

  // Setup event listeners
  const handleBeforeUnload = () => {
    cleanupAll();
  };

  const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (isCleanedUp) return;
    if (areaName === "local" && changes[ENABLED_KEY]) {
      cachedEnabled = changes[ENABLED_KEY].newValue === true;
      enabledCacheTimestamp = Date.now();

      if (!cachedEnabled) {
        cleanupAll();
      }
    }
  };

  const abortController = new AbortController();
  window.addEventListener("beforeunload", handleBeforeUnload, { signal: abortController.signal });
  chrome.storage.onChanged.addListener(handleStorageChange);

  // Cleanup functions
  const cleanupAll = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;

    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    scanTimers.forEach(timer => clearTimeout(timer));
    scanTimers = [];
    observer.disconnect();

    abortController.abort();
    chrome.storage.onChanged.removeListener(handleStorageChange);
  };

  const disableObserverOnly = () => {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    scanTimers.forEach(timer => clearTimeout(timer));
    scanTimers = [];
    observer.disconnect();
    console.log('[TilesWatcher] Observer disabled (storage listeners remain active)');
  };

  return { disableObserverOnly, cleanupAll };
}
