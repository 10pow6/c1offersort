import {
  extractMerchantTLD,
  extractMerchantName,
  extractMileageText,
  shouldExcludeTile,
} from '@/shared/domHelpers';
import { getFavorites, createStarButton, type Favorite } from '@/shared/favoritesHelpers';
import { isContextInvalidatedError, safeStorageGet } from '@/utils/contextCheck';

const ENABLED_KEY = "c1-favorites-enabled";

/**
 * Injects favorite star buttons into offer tiles.
 * Stars are positioned absolutely in the top-right corner of each tile.
 *
 * @param tiles - Array of tile elements to inject stars into
 */
export async function injectStarsIntoTiles(tiles: HTMLElement[]): Promise<void> {
  const favorites = await getFavorites();
  const favoritedTLDs = new Set(favorites.map((fav: Favorite) => fav.merchantTLD));

  for (const tile of tiles) {
    try {
      if (tile.querySelector(".c1-favorite-star")) {
        continue;
      }

      const merchantTLD = extractMerchantTLD(tile);
      const merchantName = extractMerchantName(tile);
      const mileageValue = extractMileageText(tile);

      if (!merchantTLD) {
        continue;
      }

      const isInitiallyFavorited = favoritedTLDs.has(merchantTLD);
      const starButton = createStarButton(
        merchantTLD,
        merchantName,
        mileageValue,
        isInitiallyFavorited
      );

      const standardTile = tile.querySelector(".standard-tile");
      if (standardTile) {
        standardTile.appendChild(starButton);
      } else {
        if (window.getComputedStyle(tile).position === "static") {
          tile.style.position = "relative";
        }
        tile.appendChild(starButton);
      }
    } catch (error) {
      console.error("Failed to inject star:", error);
    }
  }
}

/**
 * Re-injects favorite stars after sorting operation.
 * Only runs if favorites feature is enabled in storage.
 * Returns silently if extension context is invalidated.
 */
export async function reinjectStarsAfterSort(): Promise<void> {
  try {
    const enabledResult = await safeStorageGet(ENABLED_KEY, { [ENABLED_KEY]: false });
    const isEnabled = enabledResult[ENABLED_KEY] === true;

    if (!isEnabled) {
      return;
    }

    const allTilesRaw = document.querySelectorAll('[data-testid^="feed-tile-"]');
    const allTiles = Array.from(allTilesRaw).filter(
      (tile) => !shouldExcludeTile(tile)
    );
    if (allTiles.length > 0) {
      await injectStarsIntoTiles(allTiles as HTMLElement[]);
    }
  } catch (error) {
    if (isContextInvalidatedError(error)) {
      console.warn('[Favorites] Extension context invalidated during reinjection');
      return;
    }
    throw error;
  }
}

/**
 * Enables the favorites feature by injecting star buttons into all visible tiles
 * and setting up a MutationObserver to inject stars into new tiles as they appear.
 *
 * @param favoritesObserverRef - Reference to store the MutationObserver
 * @returns Result with success status and current favorites count
 */
export async function injectFavorites(
  favoritesObserverRef: { current: MutationObserver | null }
): Promise<{ success: boolean; favoritesCount: number; error?: string }> {
  try {
    const favorites = await getFavorites();

    // CRITICAL FIX: Disconnect old observer before creating new one to prevent accumulation
    if (favoritesObserverRef.current) {
      console.log('[Favorites] Disconnecting existing observer before re-injection');
      favoritesObserverRef.current.disconnect();
      favoritesObserverRef.current = null;
    }

    const allTiles = document.querySelectorAll('[data-testid^="feed-tile-"]');
    const tiles = Array.from(allTiles).filter((tile) => {
      return !shouldExcludeTile(tile);
    });

    const tilesWithStars = tiles.filter(tile => tile.querySelector('.c1-favorite-star'));
    if (tilesWithStars.length > 0 && tilesWithStars.length === tiles.length) {
      return {
        success: true,
        favoritesCount: favorites.length,
      };
    }

    await injectStarsIntoTiles(tiles as HTMLElement[]);

    const observer = new MutationObserver(async (mutations) => {
      const newTiles: HTMLElement[] = [];

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement && node.hasAttribute("data-testid")) {
            const testId = node.getAttribute("data-testid");
            if (testId && testId.startsWith("feed-tile-")) {
              newTiles.push(node);
            }
          }
        }
      }

      if (newTiles.length > 0) {
        const favorites = await getFavorites();
        const favoritedTLDs = new Set(favorites.map((fav) => fav.merchantTLD));

        for (const tile of newTiles) {
          const merchantTLD = extractMerchantTLD(tile);
          const merchantName = extractMerchantName(tile);
          const mileageValue = extractMileageText(tile);

          if (!merchantTLD || tile.querySelector(".c1-favorite-star")) {
            continue;
          }

          const isInitiallyFavorited = favoritedTLDs.has(merchantTLD);
          const starButton = createStarButton(
            merchantTLD,
            merchantName,
            mileageValue,
            isInitiallyFavorited
          );

          const standardTile = tile.querySelector(".standard-tile");
          if (standardTile) {
            standardTile.appendChild(starButton);
          } else {
            if (window.getComputedStyle(tile).position === "static") {
              tile.style.position = "relative";
            }
            tile.appendChild(starButton);
          }
        }
      }
    });

    favoritesObserverRef.current = observer;

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Use 'once' option to prevent accumulating multiple listeners
    window.addEventListener('beforeunload', () => {
      observer.disconnect();
      favoritesObserverRef.current = null;
    }, { once: true });

    return {
      success: true,
      favoritesCount: favorites.length,
    };
  } catch (error) {
    console.error("[Favorites] Injection error:", error);
    return {
      success: false,
      favoritesCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Disables the favorites feature by removing all star buttons from tiles
 * and disconnecting the MutationObserver.
 * Properly cleans up event listeners to prevent memory leaks.
 *
 * @param favoritesObserverRef - Reference to the MutationObserver
 * @returns Result with success status and count of stars removed
 */
export async function removeFavoritesStars(
  favoritesObserverRef: { current: MutationObserver | null }
): Promise<{ success: boolean; starsRemoved: number }> {
  const starButtons = document.querySelectorAll('.c1-favorite-star');
  let removedCount = 0;

  starButtons.forEach((button) => {
    const controller = (button as any).__abortController;
    if (controller) {
      controller.abort();
    }
    button.remove();
    removedCount++;
  });

  if (favoritesObserverRef.current) {
    favoritesObserverRef.current.disconnect();
    favoritesObserverRef.current = null;
  }

  return {
    success: true,
    starsRemoved: removedCount,
  };
}
