/**
 * Pure DOM query operations with caching
 */

import { SELECTORS } from '@/utils/constants';

// Cache container to avoid repeated DOM queries
let cachedContainer: HTMLElement | null = null;
let lastContainerCheck = 0;
const CONTAINER_CACHE_TTL = 5000; // Cache for 5 seconds

// Cache tile IDs to avoid expensive O(n²) lookups
const tileIdCache = new WeakMap<HTMLElement, string>();

/**
 * Clear the cached container (useful when page structure changes)
 */
export function clearContainerCache(): void {
  cachedContainer = null;
  lastContainerCheck = 0;
}

/**
 * Find the main container holding all offer tiles
 */
export function findMainContainer(): HTMLElement | null {
  // Return cached container if still valid
  const now = Date.now();
  if (cachedContainer && (now - lastContainerCheck) < CONTAINER_CACHE_TTL) {
    return cachedContainer;
  }

  const container = document.querySelector(SELECTORS.container) as HTMLElement;

  if (container) {
    cachedContainer = container;
    lastContainerCheck = now;
    return container;
  }

  return null;
}

/**
 * Find all offer tiles in the main container
 * @param suppressWarning - If true, don't log warning when container not found
 */
export function findAllTiles(suppressWarning = false): HTMLElement[] {
  const container = findMainContainer();

  if (!container) {
    if (!suppressWarning) {
      console.warn('[DOMQueries] Cannot find tiles - no container found');
    }
    return [];
  }

  const tiles = Array.from(container.querySelectorAll(SELECTORS.offerTile)) as HTMLElement[];
  return tiles;
}

/**
 * Find the "View More Offers" pagination button
 */
export function findViewMoreButton(): HTMLButtonElement | null {
  return document.querySelector(SELECTORS.viewMoreButton) as HTMLButtonElement;
}

/**
 * Generate a unique ID for a tile
 * Uses data-testid if available, otherwise creates ID from merchant name
 */
export function getTileId(tile: HTMLElement): string {
  // Check cache first
  const cached = tileIdCache.get(tile);
  if (cached) {
    return cached;
  }

  const testId = tile.getAttribute('data-testid');
  if (testId) {
    tileIdCache.set(tile, testId);
    return testId;
  }

  // For tiles without data-testid, create unique ID
  const uniqueId = `tile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  tileIdCache.set(tile, uniqueId);
  return uniqueId;
}

/**
 * Check if tile is a skeleton (loading) tile
 */
export function isSkeletonTile(tile: Element): boolean {
  const testId = tile.getAttribute('data-testid') || '';
  return testId.includes('skeleton');
}

/**
 * Check if tile is a carousel tile
 */
export function isCarouselTile(tile: Element): boolean {
  const testId = tile.getAttribute('data-testid') || '';
  return testId.includes('carousel');
}

/**
 * Check if tile should be excluded from processing
 */
export function shouldExcludeTile(tile: Element): boolean {
  return isSkeletonTile(tile) || isCarouselTile(tile);
}

/**
 * Count real (non-skeleton, non-carousel) tiles
 */
export function countRealTiles(): number {
  const allTiles = document.querySelectorAll('[data-testid^="feed-tile-"]');
  let count = 0;

  for (const tile of allTiles) {
    if (!shouldExcludeTile(tile)) {
      count++;
    }
  }

  return count;
}
