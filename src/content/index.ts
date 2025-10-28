/**
 * Content script entry point for C1 Offers Sorter extension.
 * Sets up message handlers, tile watchers, and coordinates feature modules.
 */

import { setupMessageHandler } from './messaging/messageHandler';
import { setupTilesWatcher } from './modules/favorites/watcher';
import { reinjectStarsAfterSort } from './modules/favorites/inject';

let processedTiles = new Set<string>();
let fullyPaginated = { value: false };
let favoritesObserver: { current: MutationObserver | null } = { current: null };

const reinjectStarsCallback = () => reinjectStarsAfterSort(processedTiles);

setupMessageHandler(
  fullyPaginated,
  processedTiles,
  favoritesObserver,
  reinjectStarsCallback
);

setupTilesWatcher(processedTiles);
