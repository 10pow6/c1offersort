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
    // Check if table view is active
    const isTableViewActive = !!document.getElementById('c1-offers-table-container');

    if (mainContainer && showFavoritesOnly && !isTableViewActive) {
      // Only modify main container display if NOT in table view
      mainContainer.style.setProperty("display", "grid", "important");
      mainContainer.style.gridTemplateAreas = "none";
      mainContainer.style.gridAutoFlow = "row";
    }

    // Get tiles from both main container and table container (if table view is active)
    const mainTiles = findAllTiles();
    const tableTiles = Array.from(document.querySelectorAll('#c1-offers-table [data-testid^="feed-tile-"]')) as HTMLElement[];

    // Combine and deduplicate
    const tileMap = new Map<HTMLElement, boolean>();
    [...mainTiles, ...tableTiles].forEach(tile => tileMap.set(tile, true));
    const tiles = Array.from(tileMap.keys());

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
          // Don't override the sort order - preserve it so sorting still works
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
        // Only remove order if it was set with !important by this filter
        const orderPriority = (tile as HTMLElement).style.getPropertyPriority('order');
        if (orderPriority === 'important') {
          (tile as HTMLElement).style.removeProperty('order');
        }
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

    // Reset container style if removing filter (but only if not in table view)
    if (!showFavoritesOnly && mainContainer && !isTableViewActive) {
      // Only reset main container display if NOT in table view
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
