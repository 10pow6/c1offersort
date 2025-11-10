/**
 * Pure sorting logic (no DOM access, no side effects).
 * Takes tile data, returns sorted order.
 */

import type { TileData } from './sorting.types';

export class TileSorter {
  /**
   * Sort tiles by criteria and order.
   * Returns array with sort order assigned.
   */
  static sort(
    tiles: TileData[],
    criteria: string,
    order: string
  ): Array<TileData & { sortOrder: number }> {
    const sorted = [...tiles];

    // Determine sort function
    const compareFn = this.getCompareFn(criteria, order);

    // Sort
    sorted.sort(compareFn);

    // Assign sort order
    return sorted.map((tile, index) => ({
      ...tile,
      sortOrder: index
    }));
  }

  /**
   * Apply sort order to DOM elements
   */
  static applyToDOM(sortedTiles: Array<TileData & { sortOrder: number }>): void {
    // PERFORMANCE: Use requestAnimationFrame for batched writes
    requestAnimationFrame(() => {
      sortedTiles.forEach((item) => {
        if (!item.element) return;

        // Use cssText for faster style application
        // Apply content-visibility optimization
        item.element.style.cssText += `
          grid-area: auto !important;
          order: ${item.sortOrder} !important;
          content-visibility: auto;
          contain: layout style;
          contain-intrinsic-size: auto 200px;
        `;
      });
    });
  }

  private static getCompareFn(
    criteria: string,
    order: string
  ): (a: TileData, b: TileData) => number {
    const isDescending = order.startsWith('desc');

    switch (criteria) {
      case 'alphabetical':
        return (a, b) => {
          const comparison = a.merchantName.localeCompare(b.merchantName);
          return isDescending ? -comparison : comparison;
        };

      case 'merchantMileage': {
        // Parse combined order (e.g., "desc-asc" = high miles, A-Z)
        const [mileageDir, merchantDir] = order.includes('-')
          ? order.split('-')
          : ['desc', 'asc'];

        return (a, b) => {
          // Sort by mileage first
          const mileageDiff = mileageDir === 'desc'
            ? b.mileage - a.mileage
            : a.mileage - b.mileage;

          if (mileageDiff !== 0) {
            return mileageDiff;
          }

          // Same mileage - sort by merchant name
          const nameComparison = a.merchantName.localeCompare(b.merchantName);
          return merchantDir === 'desc' ? -nameComparison : nameComparison;
        };
      }

      case 'mileage':
      default:
        return (a, b) => {
          return isDescending ? b.mileage - a.mileage : a.mileage - b.mileage;
        };
    }
  }
}
