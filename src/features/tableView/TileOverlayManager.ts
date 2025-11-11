/**
 * THE SECRET SAUCE: Invisible Overlay Workaround
 *
 * This module manages the clever workaround that makes table view work:
 * - Original offer tiles are positioned as INVISIBLE OVERLAYS over table rows
 * - User sees: Custom table UI (z-index: 1)
 * - User clicks: Invisible tile captures click (z-index: 5, opacity: 0)
 * - Result: Capital One's modal handlers work perfectly!
 *
 * This is the CORE WORKAROUND - preserve carefully!
 */

import type { TileState } from './tableView.types';

// Store tile state in memory (WeakMap for automatic GC)
const tileStateMap = new WeakMap<HTMLElement, TileState>();

/**
 * Save tile's current inline styles to memory (not DOM)
 * Only saves the ORIGINAL state before first overlay application
 */
export function saveTileState(tile: HTMLElement): void {
  if (tileStateMap.has(tile)) {
    return; // Already saved - don't overwrite original state
  }

  const state: TileState = {
    originalStyles: {
      position: tile.style.position,
      top: tile.style.top,
      left: tile.style.left,
      width: tile.style.width,
      height: tile.style.height,
      opacity: tile.style.opacity,
      pointerEvents: tile.style.pointerEvents,
      zIndex: tile.style.zIndex,
      display: tile.style.display,
      displayPriority: tile.style.getPropertyPriority('display'), // Save !important priority
    },
  };

  tileStateMap.set(tile, state);
}

/**
 * Apply invisible overlay styling to tile
 * This is THE WORKAROUND that makes clicks work!
 */
export function applyInvisibleOverlay(tile: HTMLElement): void {
  tile.style.position = 'absolute';
  tile.style.top = '0';
  tile.style.left = '0';
  tile.style.width = '100%';
  tile.style.height = '100%';
  tile.style.opacity = '0';          // INVISIBLE!
  tile.style.pointerEvents = 'auto'; // But still CLICKABLE!
  tile.style.zIndex = '5';           // Above table content (z-index: 1)
  tile.style.overflow = 'hidden';    // Prevent expansion
  tile.style.maxHeight = '100%';     // Constrain height
}

/**
 * Restore tile's original inline styles from memory
 */
export function restoreTileState(tile: HTMLElement): void {
  const state = tileStateMap.get(tile);
  if (!state) {
    return;
  }

  const { originalStyles } = state;
  tile.style.position = originalStyles.position;
  tile.style.top = originalStyles.top;
  tile.style.left = originalStyles.left;
  tile.style.width = originalStyles.width;
  tile.style.height = originalStyles.height;
  tile.style.opacity = originalStyles.opacity;
  tile.style.pointerEvents = originalStyles.pointerEvents;
  tile.style.zIndex = originalStyles.zIndex;

  // Restore display with original priority (!important if it was set)
  if (originalStyles.display) {
    tile.style.setProperty('display', originalStyles.display, originalStyles.displayPriority);
  } else {
    tile.style.removeProperty('display');
  }
}

/**
 * Check if tile has saved state
 */
export function hasSavedState(tile: HTMLElement): boolean {
  return tileStateMap.has(tile);
}
