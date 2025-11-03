import { executeSorting } from '../modules/sorting/executeSorting';
import { applyFavoritesFilter, loadAllOffers } from '../modules/favorites/filter';
import { injectFavorites, removeFavoritesStars } from '../modules/favorites/inject';

/**
 * Sets up the Chrome message listener for handling requests from the popup.
 *
 * @param fullyPaginated - Reference to track if pagination is complete
 * @param processedTiles - Set to track which tiles have been processed
 * @param favoritesObserver - Reference to the favorites MutationObserver
 * @param reinjectStarsCallback - Callback to re-inject stars after sorting
 */
export function setupMessageHandler(
  fullyPaginated: { value: boolean },
  processedTiles: Set<string>,
  favoritesObserver: { current: MutationObserver | null },
  reinjectStarsCallback: () => Promise<void>
) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== 'object' || !('type' in message)) {
      return false;
    }

    const handleAsync = async () => {
      switch (message.type) {
        case 'SORT_REQUEST':
          return await executeSorting(
            message.criteria,
            message.order,
            fullyPaginated,
            processedTiles,
            reinjectStarsCallback
          );
        case 'FILTER_REQUEST':
          return await applyFavoritesFilter(message.showFavoritesOnly, fullyPaginated);
        case 'LOAD_ALL_REQUEST':
          return await loadAllOffers(fullyPaginated);
        case 'INJECT_FAVORITES_REQUEST':
          return await injectFavorites(favoritesObserver);
        case 'REMOVE_FAVORITES_REQUEST':
          return await removeFavoritesStars(favoritesObserver);
        default:
          return { success: false, error: 'Unknown message type' };
      }
    };

    handleAsync().then(sendResponse).catch((error) => {
      sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    });

    return true;
  });
}
