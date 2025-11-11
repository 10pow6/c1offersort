/**
 * Orchestrates all favorites operations
 * Central coordination point for favorites feature
 */

import { findMainContainer } from '@/platform/dom/DOMQueries';
import { injectFavorites, removeFavoritesStars } from './StarInjector';
import { applyFavoritesFilter } from './FavoritesFilter';
import { setupTilesWatcher } from './TilesWatcher';
import { emitEvent } from '@/core/events/events.types';
import type { FavoritesInjectResult, FavoritesFilterResult } from './favorites.types';

let watcherCleanup: { disableObserverOnly: () => void; cleanupAll: () => void } | null = null;
const processedTiles = new WeakMap<HTMLElement, boolean>();

/**
 * Initialize favorites feature
 * The watcher will handle the case where DOM isn't ready yet
 */
export function initializeFavorites(): void {
  // Setup tiles watcher - it will wait for DOM to be ready
  watcherCleanup = setupTilesWatcher(processedTiles);
  console.log('[FavoritesOrchestrator] Favorites watcher initialized');
}

/**
 * Enable favorites (inject star buttons)
 */
export async function enableFavorites(): Promise<FavoritesInjectResult> {
  try {
    const container = findMainContainer();
    if (!container) {
      return {
        success: false,
        error: 'Container not found',
      };
    }

    const result = await injectFavorites(container, processedTiles);

    if (result.success) {
      await emitEvent({ type: 'FAVORITES_ENABLED' });
    }

    return result;
  } catch (error) {
    console.error('[FavoritesOrchestrator] Failed to enable favorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Disable favorites (remove star buttons)
 */
export async function disableFavorites(): Promise<FavoritesInjectResult> {
  try {
    const result = await removeFavoritesStars();

    if (result.success) {
      // Clear the processed tiles map so stars can be re-injected next time
      // Note: We can't actually clear a WeakMap, but we can create a new one
      // Instead, we'll rely on the injectFavorites logic to check if stars already exist
      await emitEvent({ type: 'FAVORITES_DISABLED' });
    }

    return result;
  } catch (error) {
    console.error('[FavoritesOrchestrator] Failed to disable favorites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Apply favorites filter
 */
export async function filterFavorites(showFavoritesOnly: boolean): Promise<FavoritesFilterResult> {
  try {
    // Disable watcher observer during filtering to prevent interference
    if (showFavoritesOnly && watcherCleanup) {
      watcherCleanup.disableObserverOnly();
    }

    const result = await applyFavoritesFilter(showFavoritesOnly);

    if (result.success) {
      if (showFavoritesOnly) {
        await emitEvent({ type: 'FAVORITES_FILTER_ENABLED' });
      } else {
        await emitEvent({ type: 'FAVORITES_FILTER_DISABLED' });
      }
    }

    return result;
  } catch (error) {
    console.error('[FavoritesOrchestrator] Failed to filter favorites:', error);
    return {
      success: false,
      tilesShown: 0,
      tilesHidden: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get watcher cleanup (for legacy compatibility)
 */
export function getWatcherCleanup() {
  return watcherCleanup;
}

/**
 * Cleanup all favorites resources
 */
export function cleanupFavorites(): void {
  if (watcherCleanup) {
    watcherCleanup.cleanupAll();
    watcherCleanup = null;
  }
}
