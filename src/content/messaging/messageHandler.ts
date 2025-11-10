import { executeSorting } from '../modules/sorting/executeSorting';
import { applyFavoritesFilter, loadAllOffers } from '../modules/favorites/filter';
import { injectFavorites, removeFavoritesStars } from '../modules/favorites/inject';
import { updateStarState } from '../modules/favorites/updateStarState';
import { applyTableView, removeTableView, refreshTableView } from '../modules/tableView';
import { getWatcherCleanup } from '../index';

// Track current view mode
let currentViewMode: 'grid' | 'table' = 'grid';

/**
 * Gets the current view mode state
 * Used by internal modules to check the current view mode
 */
export function getViewMode(): 'grid' | 'table' {
  return currentViewMode;
}

/**
 * Updates the current view mode state
 * Used by internal modules (like sorting) to keep state in sync
 */
export function updateViewMode(mode: 'grid' | 'table'): void {
  console.log('[MessageHandler] Updating view mode to:', mode);
  currentViewMode = mode;
}

/**
 * Sets up the Chrome message listener for handling requests from the popup.
 *
 * @param fullyPaginated - Reference to track if pagination is complete
 * @param processedTiles - WeakMap to track which tiles have been processed (auto GC)
 * @param favoritesObserver - Reference to the favorites MutationObserver
 * @param reinjectStarsCallback - Callback to re-inject stars after sorting
 * @param progressState - In-memory progress tracking state
 */
export function setupMessageHandler(
  fullyPaginated: { value: boolean },
  processedTiles: WeakMap<HTMLElement, boolean>,
  favoritesObserver: { current: MutationObserver | null },
  reinjectStarsCallback: () => Promise<void>,
  progressState: {
    sort: {
      isActive: boolean;
      progress: {
        type: "pagination" | "sorting";
        offersLoaded?: number;
        pagesLoaded?: number;
        totalOffers?: number;
      } | null;
    };
    filter: {
      isActive: boolean;
      progress: {
        offersLoaded: number;
        pagesLoaded: number;
      } | null;
    };
  }
) {
  console.log('[MessageHandler] Setting up message listener...');

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('[MessageHandler] Received message:', message);

    if (!message || typeof message !== 'object' || !('type' in message)) {
      console.log('[MessageHandler] Invalid message format');
      return false;
    }

    const handleAsync = async () => {
      console.log('[MessageHandler] Handling message type:', message.type);
      switch (message.type) {
        case 'SORT_REQUEST':
          console.log('[MessageHandler] Processing SORT_REQUEST');
          progressState.sort.isActive = true;
          progressState.sort.progress = null;
          const sortResult = await executeSorting(
            message.criteria,
            message.order,
            fullyPaginated,
            processedTiles,
            reinjectStarsCallback,
            progressState
          );
          progressState.sort.isActive = false;
          progressState.sort.progress = null;

          // Send completion message to popup in case it reopened during sorting
          try {
            chrome.runtime.sendMessage({
              type: 'SORT_COMPLETE',
              result: sortResult
            }).catch(() => console.log('[MessageHandler] Popup not available for completion message'));
          } catch (e) {
            console.log('[MessageHandler] Failed to send completion message:', e);
          }

          return sortResult;
        case 'FILTER_REQUEST':
          progressState.filter.isActive = message.showFavoritesOnly;
          progressState.filter.progress = null;
          const filterResult = await applyFavoritesFilter(message.showFavoritesOnly, fullyPaginated);
          progressState.filter.isActive = false;
          progressState.filter.progress = null;

          // If in table view, refresh to reflect the filter changes
          await refreshTableView();

          return filterResult;
        case 'LOAD_ALL_REQUEST':
          return await loadAllOffers(fullyPaginated);
        case 'INJECT_FAVORITES_REQUEST':
          // Ensure storage is updated first
          await chrome.storage.local.set({ 'c1-favorites-enabled': true });

          // Inject stars into tiles
          const injectResult = await injectFavorites(favoritesObserver);

          // If in table view, also inject into table's tiles specifically
          const tableContainer = document.getElementById('c1-offers-table-container');
          if (tableContainer) {
            console.log('[MessageHandler] Table view active - injecting stars into table tiles');
            const tableTiles = Array.from(document.querySelectorAll('#c1-offers-table [data-testid^="feed-tile-"]')) as HTMLElement[];
            console.log('[MessageHandler] Found', tableTiles.length, 'tiles in table');

            if (tableTiles.length > 0) {
              // Manually inject stars into table tiles since they might not be found by findAllTiles
              const { injectStarsIntoTiles } = await import('../modules/favorites/inject');
              await injectStarsIntoTiles(tableTiles, false);
            }
          }

          // Wait for injection to complete
          await new Promise(resolve => setTimeout(resolve, 100));

          // If in table view, refresh to show star column
          await refreshTableView();

          return injectResult;
        case 'REMOVE_FAVORITES_REQUEST':
          const watcherCleanup = getWatcherCleanup();
          if (watcherCleanup) {
            watcherCleanup.cleanupAll();
          }

          // Ensure storage is updated first
          await chrome.storage.local.set({ 'c1-favorites-enabled': false });

          // Clear any active favorites filter BEFORE removing stars
          // This ensures all tiles are visible when refreshTableView() re-extracts data
          console.log('[MessageHandler] Clearing any active favorites filter before removing stars');
          await applyFavoritesFilter(false, fullyPaginated, true);

          // Remove stars from tiles
          const removeResult = await removeFavoritesStars(favoritesObserver);

          // Wait for removal to fully complete
          await new Promise(resolve => setTimeout(resolve, 100));

          // If in table view, refresh to hide star column
          // At this point all tiles should be visible (filter cleared above)
          await refreshTableView();

          return removeResult;
        case 'UPDATE_STAR_STATE':
          updateStarState(message.merchantTLD, message.isFavorited);
          return { success: true };
        case 'GET_SORT_PROGRESS':
          console.log('[MessageHandler] Processing GET_SORT_PROGRESS');
          return {
            isActive: progressState.sort.isActive,
            progress: progressState.sort.progress,
          };
        case 'GET_FILTER_PROGRESS':
          console.log('[MessageHandler] Processing GET_FILTER_PROGRESS');
          return {
            isActive: progressState.filter.isActive,
            progress: progressState.filter.progress,
          };
        case 'VIEW_MODE_REQUEST':
          console.log('[MessageHandler] Processing VIEW_MODE_REQUEST:', message.viewMode);
          if (message.viewMode === 'table') {
            const result = await applyTableView();
            if (result.success) {
              currentViewMode = 'table';
            }
            return result;
          } else {
            const result = await removeTableView();
            if (result.success) {
              currentViewMode = 'grid';

              // Check if favorites filter was active and re-apply it
              // (removeTableView restores original display styles, clearing filter)
              const filterState = await chrome.storage.local.get('c1-favorites-filter-active');
              const isFilterActive = filterState['c1-favorites-filter-active'] === true;

              if (isFilterActive) {
                console.log('[MessageHandler] Re-applying favorites filter after switching to grid view');
                await applyFavoritesFilter(true, fullyPaginated, true);
              }
            }
            return result;
          }
        case 'GET_VIEW_MODE':
          console.log('[MessageHandler] Processing GET_VIEW_MODE, current mode:', currentViewMode);
          return { viewMode: currentViewMode };
        default:
          console.log('[MessageHandler] Unknown message type:', message.type);
          return { success: false, error: 'Unknown message type' };
      }
    };

    handleAsync()
      .then((result) => {
        console.log('[MessageHandler] Sending response:', result);
        sendResponse(result);
      })
      .catch((error) => {
        console.error('[MessageHandler] Error handling message:', error);
        sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      });

    return true;
  });

  console.log('[MessageHandler] Message listener setup complete');
}
