/**
 * Favorites filter - show only favorited offers
 * Replaces: src/content/modules/favorites/filter.ts
 */

import { findAllTiles, findMainContainer } from '@/platform/dom/DOMQueries';
import { extractMerchantTLD } from '@/platform/dom/TileExtractor';
import { getFavorites } from './FavoritesStore';
import type { FavoritesFilterResult } from './favorites.types';

/**
 * Apply or remove favorites filter
 */
export async function applyFavoritesFilter(
  showFavoritesOnly: boolean
): Promise<FavoritesFilterResult> {
  try {
    // Store filter state in storage
    await chrome.storage.local.set({ 'c1-favorites-filter-active': showFavoritesOnly });

    const favorites = await getFavorites();
    const favoritedTLDs = new Set(favorites.map((fav) => fav.merchantTLD));

    const mainContainer = findMainContainer();
    if (mainContainer && showFavoritesOnly) {
      mainContainer.style.setProperty("display", "grid", "important");
      mainContainer.style.gridTemplateAreas = "none";
      mainContainer.style.gridAutoFlow = "row";
    }

    const tiles = findAllTiles();

    let hiddenCount = 0;
    let shownCount = 0;
    const missingFavorites: string[] = [];
    const foundFavorites = new Set<string>();

    for (const tile of tiles) {
      const merchantTLD = extractMerchantTLD(tile as HTMLElement);
      const isFavorited = favoritedTLDs.has(merchantTLD);

      if (showFavoritesOnly) {
        if (isFavorited) {
          (tile as HTMLElement).style.removeProperty('display');
          (tile as HTMLElement).style.setProperty('grid-area', 'auto', 'important');
          (tile as HTMLElement).style.setProperty('order', '0', 'important');
          shownCount++;
          foundFavorites.add(merchantTLD);
        } else {
          (tile as HTMLElement).style.setProperty('display', 'none', 'important');
          hiddenCount++;
        }
      } else {
        // Remove filter - show all tiles
        (tile as HTMLElement).style.removeProperty('display');
        (tile as HTMLElement).style.removeProperty('grid-area');
        (tile as HTMLElement).style.removeProperty('order');
        shownCount++;
      }
    }

    // Find missing favorites (favorited but not on page)
    if (showFavoritesOnly) {
      for (const fav of favorites) {
        if (!foundFavorites.has(fav.merchantTLD)) {
          missingFavorites.push(fav.merchantName);
        }
      }
    }

    // Reset container style if removing filter
    if (!showFavoritesOnly && mainContainer) {
      mainContainer.style.removeProperty('display');
      mainContainer.style.removeProperty('grid-template-areas');
      mainContainer.style.removeProperty('grid-auto-flow');
    }

    return {
      success: true,
      tilesShown: shownCount,
      tilesHidden: hiddenCount,
      missingFavorites: missingFavorites.length > 0 ? missingFavorites : undefined,
    };
  } catch (error) {
    console.error('[FavoritesFilter] Failed to apply filter:', error);
    return {
      success: false,
      tilesShown: 0,
      tilesHidden: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if favorites filter is currently active
 */
export async function isFilterActive(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get('c1-favorites-filter-active');
    return result['c1-favorites-filter-active'] === true;
  } catch (error) {
    console.error('[FavoritesFilter] Failed to check filter state:', error);
    return false;
  }
}
