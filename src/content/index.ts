/**
 * Content script entry point for C1 Offers Sorter extension.
 * Sets up message handlers, tile watchers, and coordinates feature modules.
 */

import { setupMessageHandler } from './messaging/messageHandler';
import { setupTilesWatcher } from './modules/favorites/watcher';
import { reinjectStarsAfterSort } from './modules/favorites/inject';
import { config } from '../config';
import { VALID_URLS } from '../utils/constants';

console.log(`${config.logging.contexts.content} Initializing C1 Offers Sorter...`);

// Validate we're on a Capital One offers page
const currentUrl = window.location.href;
const isValidPage = VALID_URLS.some(validUrl => currentUrl.startsWith(validUrl));

if (!isValidPage) {
  console.error(`${config.logging.contexts.content} ❌ Not a Capital One offers page - extension may not work correctly`);
} else {
  console.log(`${config.logging.contexts.content} ✅ Valid Capital One offers page detected`);
}

let processedTiles = new WeakMap<HTMLElement, boolean>(); // WeakMap for automatic GC
let fullyPaginated = { value: false };
let favoritesObserver: { current: MutationObserver | null } = { current: null };
let tilesWatcherCleanup: { disableObserverOnly: () => void; cleanupAll: () => void } | null = null;

// In-memory progress tracking (no storage writes)
export const progressState = {
  sort: {
    isActive: false,
    progress: null as {
      type: "pagination" | "sorting";
      offersLoaded?: number;
      pagesLoaded?: number;
      totalOffers?: number;
    } | null,
  },
  filter: {
    isActive: false,
    progress: null as {
      offersLoaded: number;
      pagesLoaded: number;
    } | null,
  },
};

// Export cleanup functions for use by message handlers
export function getWatcherCleanup(): { disableObserverOnly: () => void; cleanupAll: () => void } | null {
  return tilesWatcherCleanup;
}

const reinjectStarsCallback = () => reinjectStarsAfterSort();

console.log(`${config.logging.contexts.content} Setting up message handler...`);
setupMessageHandler(
  fullyPaginated,
  processedTiles,
  favoritesObserver,
  reinjectStarsCallback,
  progressState
);

console.log(`${config.logging.contexts.content} Setting up tiles watcher...`);
tilesWatcherCleanup = setupTilesWatcher(processedTiles);

console.log(`${config.logging.contexts.content} Initialization complete`);
