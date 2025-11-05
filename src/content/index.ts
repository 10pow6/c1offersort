/**
 * Content script entry point for C1 Offers Sorter extension.
 * Sets up message handlers, tile watchers, and coordinates feature modules.
 */

import { setupMessageHandler } from './messaging/messageHandler';
import { setupTilesWatcher } from './modules/favorites/watcher';
import { reinjectStarsAfterSort } from './modules/favorites/inject';
import { config } from '../config';

console.log(`${config.logging.contexts.content} Initializing C1 Offers Sorter...`);

let processedTiles = new Set<string>();
let fullyPaginated = { value: false };
let favoritesObserver: { current: MutationObserver | null } = { current: null };

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
setupTilesWatcher(processedTiles);

console.log(`${config.logging.contexts.content} Initialization complete`);
