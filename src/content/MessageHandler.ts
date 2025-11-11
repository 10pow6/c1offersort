/**
 * Message handler - routes messages from popup to orchestrator
 */

import { ContentOrchestrator } from './ContentOrchestrator';

const orchestrator = new ContentOrchestrator();

export function setupMessageHandler(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('[MessageHandler] Received message:', message.type);

    if (!message || typeof message !== 'object' || !('type' in message)) {
      return false;
    }

    const handleAsync = async () => {
      switch (message.type) {
        case 'SORT_REQUEST':
          return await orchestrator.handleSort(message.criteria, message.order);

        case 'VIEW_MODE_REQUEST':
          return await orchestrator.handleViewModeChange(message.viewMode);

        case 'GET_VIEW_MODE':
          return orchestrator.getViewMode();

        case 'INJECT_FAVORITES_REQUEST':
          return await orchestrator.handleInjectFavorites();

        case 'REMOVE_FAVORITES_REQUEST':
          return await orchestrator.handleRemoveFavorites();

        case 'FILTER_REQUEST':
          return await orchestrator.handleFavoritesFilter(message.showFavoritesOnly);

        case 'UPDATE_STAR_STATE':
          const { updateStarButton } = await import('@/features/favorites/StarButton');
          // Find all star buttons for this merchant and update them
          const stars = document.querySelectorAll(`.c1-favorite-star[data-merchant-tld="${message.merchantTLD}"]`);
          stars.forEach((star) => updateStarButton(star as HTMLElement, message.isFavorited));
          return { success: true };

        case 'GET_SORT_PROGRESS':
          const { sortState } = await import('@/core/state/SortState');
          const state = sortState.get();
          return {
            isActive: state.isActive,
            progress: state.progress,
          };

        case 'GET_FILTER_PROGRESS':
          return {
            isActive: false,
            progress: null,
          };

        default:
          console.warn('[MessageHandler] Unknown message type:', message.type);
          return { success: false, error: 'Unknown message type' };
      }
    };

    handleAsync()
      .then((result) => {
        sendResponse(result);
      })
      .catch((error) => {
        console.error('[MessageHandler] Error handling message:', error);
        sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      });

    return true; // Will respond asynchronously
  });
}
