/**
 * Injects star buttons into tiles
 * Replaces: src/content/modules/favorites/inject.ts
 */

import { findAllTiles } from '@/platform/dom/DOMQueries';
import { extractMerchantTLD, extractMerchantName } from '@/platform/dom/TileExtractor';
import { getFavorites } from './FavoritesStore';
import { createStarButton, injectStarHoverStyles, setupStarEventDelegation } from './StarButton';
import type { FavoritesInjectResult } from './favorites.types';

let eventDelegationSetup = false;
let clickAbortController: AbortController | null = null;

/**
 * Check if tile should be excluded from star injection
 */
function shouldExcludeTile(tile: HTMLElement): boolean {
  // Skip tiles that already have stars
  if (tile.querySelector('.c1-favorite-star')) {
    return true;
  }

  // Skip tiles without proper data
  const merchantTLD = extractMerchantTLD(tile);
  if (!merchantTLD || merchantTLD === 'unknown') {
    return true;
  }

  return false;
}

/**
 * Inject star button into a single tile (synchronous with pre-loaded favorites)
 */
function injectStarIntoTile(tile: HTMLElement, favoritedTLDs: Set<string>): boolean {
  if (shouldExcludeTile(tile)) {
    return false;
  }

  const merchantTLD = extractMerchantTLD(tile);
  const merchantName = extractMerchantName(tile);

  if (!merchantTLD || !merchantName) {
    return false;
  }

  const initiallyFavorited = favoritedTLDs.has(merchantTLD);

  const star = createStarButton(tile, {
    merchantTLD,
    merchantName,
    initiallyFavorited,
  });

  // Find best container for star (prefer .standard-tile)
  const standardTile = tile.querySelector('.standard-tile') as HTMLElement;
  if (standardTile) {
    standardTile.style.position = 'relative';
    standardTile.appendChild(star);
  } else {
    tile.style.position = 'relative';
    tile.appendChild(star);
  }

  return true;
}

/**
 * Inject star buttons into multiple tiles (optimized batch processing)
 */
export async function injectStarsIntoTiles(tiles: HTMLElement[]): Promise<FavoritesInjectResult> {
  try {
    if (tiles.length === 0) {
      return { success: true, tilesProcessed: 0 };
    }

    // Load all favorites once upfront
    const favorites = await getFavorites();
    const favoritedTLDs = new Set(favorites.map(f => f.merchantTLD));

    // Batch DOM operations
    let processed = 0;

    // Use requestAnimationFrame to avoid blocking the main thread
    const processBatch = (startIdx: number, batchSize: number = 10): Promise<number> => {
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          const endIdx = Math.min(startIdx + batchSize, tiles.length);
          let batchProcessed = 0;

          for (let i = startIdx; i < endIdx; i++) {
            if (injectStarIntoTile(tiles[i], favoritedTLDs)) {
              batchProcessed++;
            }
          }

          resolve(batchProcessed);
        });
      });
    };

    // Process tiles in batches to avoid blocking UI
    const batchSize = 10;
    for (let i = 0; i < tiles.length; i += batchSize) {
      const batchProcessed = await processBatch(i, batchSize);
      processed += batchProcessed;
    }

    return {
      success: true,
      tilesProcessed: processed,
    };
  } catch (error) {
    console.error('[StarInjector] Failed to inject stars:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Inject stars into all tiles on the page
 */
export async function injectFavorites(
  container: HTMLElement,
  processedTiles: WeakMap<HTMLElement, boolean>
): Promise<FavoritesInjectResult> {
  try {
    // Setup event delegation once
    if (!eventDelegationSetup) {
      injectStarHoverStyles();
      if (clickAbortController) clickAbortController.abort();
      clickAbortController = setupStarEventDelegation(container);
      eventDelegationSetup = true;
    }

    // Find tiles to process
    const allTiles = findAllTiles(true);
    const tilesToProcess: HTMLElement[] = [];

    for (const tile of allTiles) {
      // shouldExcludeTile already checks if star exists, so we don't need processedTiles check
      if (!shouldExcludeTile(tile)) {
        tilesToProcess.push(tile);
        processedTiles.set(tile, true);
      }
    }

    // Inject stars
    const result = await injectStarsIntoTiles(tilesToProcess);

    // Mark favorites as enabled in storage
    await chrome.storage.local.set({ 'c1-favorites-enabled': true });

    return result;
  } catch (error) {
    console.error('[StarInjector] Failed to inject favorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Remove all star buttons from tiles
 */
export async function removeFavoritesStars(): Promise<FavoritesInjectResult> {
  try {
    const allStars = document.querySelectorAll('.c1-favorite-star');
    allStars.forEach((star) => star.remove());

    // Cleanup event delegation
    if (clickAbortController) {
      clickAbortController.abort();
      clickAbortController = null;
    }
    eventDelegationSetup = false;

    // Mark favorites as disabled in storage
    await chrome.storage.local.set({ 'c1-favorites-enabled': false });

    return {
      success: true,
      tilesProcessed: allStars.length,
    };
  } catch (error) {
    console.error('[StarInjector] Failed to remove favorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
