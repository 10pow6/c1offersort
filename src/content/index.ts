/**
 * NEW Content script entry point for C1 Offers Sorter extension.
 * Refactored to use centralized orchestration.
 */

import { setupMessageHandler } from './MessageHandler';
import { initializeFavorites, getWatcherCleanup as getFavoritesWatcherCleanup } from '@/features/favorites/FavoritesOrchestrator';
import { config } from '../config';
import { VALID_URLS } from '../utils/constants';
import { clearContainerCache } from '@/platform/dom/DOMQueries';
import { favoritesStore } from '@/core/storage/FavoritesStore';

// Export for legacy compatibility
export function getWatcherCleanup() {
  return getFavoritesWatcherCleanup();
}

export const progressState = {
  sort: {
    isActive: false,
    progress: null as any,
  },
  filter: {
    isActive: false,
    progress: null as any,
  },
};

console.log(`${config.logging.contexts.content} Initializing C1 Offers Sorter (REFACTORED)...`);

// Clear ALL feature states on page load - all features should be disabled by default
chrome.storage.local.set({
  'c1-view-mode': 'grid',
  'c1-favorites-enabled': false,
  'c1-favorites-filter-active': false
}).catch(() => {});

// Reset any favorites filter
(async () => {
  try {
    const { findAllTiles, findMainContainer } = await import('@/platform/dom/DOMQueries');

    await new Promise(resolve => setTimeout(resolve, 500));

    const tiles = findAllTiles(true);
    const mainContainer = findMainContainer();

    for (const tile of tiles) {
      (tile as HTMLElement).style.removeProperty('display');
      (tile as HTMLElement).style.removeProperty('grid-area');
      (tile as HTMLElement).style.removeProperty('order');
    }

    if (mainContainer) {
      mainContainer.style.removeProperty('display');
      mainContainer.style.removeProperty('grid-template-areas');
      mainContainer.style.removeProperty('grid-auto-flow');
    }

    console.log(`${config.logging.contexts.content} Reset favorites filter`);
  } catch (error) {
    console.log(`${config.logging.contexts.content} No filter to reset`);
  }
})();

// Validate page URL
const currentUrl = window.location.href;
const isValidPage = VALID_URLS.some(validUrl => currentUrl.startsWith(validUrl));

if (!isValidPage) {
  console.error(`${config.logging.contexts.content} ❌ Not a Capital One offers page`);
} else {
  console.log(`${config.logging.contexts.content} ✅ Valid Capital One offers page`);
}

// Setup message handler
console.log(`${config.logging.contexts.content} Setting up message handler...`);
setupMessageHandler();

// Initialize favorites feature (but don't auto-enable - user must explicitly enable)
console.log(`${config.logging.contexts.content} Initializing favorites...`);
initializeFavorites();

// Flush favorites on unload
window.addEventListener('beforeunload', async () => {
  await favoritesStore.flush();
});

// Clear DOM caches when page structure changes
const resizeObserver = new ResizeObserver(() => {
  clearContainerCache();
});
const body = document.body;
if (body) {
  resizeObserver.observe(body);
}

console.log(`${config.logging.contexts.content} Initialization complete ✅`);
