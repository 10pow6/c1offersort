/**
 * Coordinates the complete sorting flow:
 * 1. Prepare grid (if in table view, switch temporarily)
 * 2. Load all tiles via pagination
 * 3. Extract tile data
 * 4. Sort tiles
 * 5. Apply to DOM
 * 6. Restore view mode if needed
 */

import type { SortResult } from './sorting.types';
import { TileSorter } from './TileSorter';
import { extractTilesData } from './TileDataExtractor';
import { findAllTiles, findMainContainer } from '@/platform/dom/DOMQueries';
import { getViewMode, setViewMode } from '@/core/state/ViewModeState';
import { setSortActive, setSortProgress, setSortResult } from '@/core/state/SortState';
import { emitEvent } from '@/core/events/events.types';

export class SortOrchestrator {
  private isInProgress = false;

  /**
   * Execute complete sort operation
   */
  async sort(criteria: string, order: string): Promise<SortResult> {
    if (this.isInProgress) {
      console.warn('[SortOrchestrator] Sort already in progress');
      return {
        success: false,
        tilesProcessed: 0,
        pagesLoaded: 0,
        error: "A sort operation is already in progress",
      };
    }

    this.isInProgress = true;
    setSortActive(true);

    try {
      await emitEvent({ type: 'SORT_STARTED', criteria: criteria as any, order: order as any });

      // Check current view mode
      const currentViewMode = getViewMode();
      const wasInTableView = currentViewMode === 'table';

      // If in table view, temporarily switch to grid for sorting
      if (wasInTableView) {
        console.log('[SortOrchestrator] Switching from table to grid for sorting');
        await emitEvent({ type: 'VIEW_MODE_CHANGING', fromMode: 'table', toMode: 'grid' });
        setViewMode('grid');
        await emitEvent({ type: 'VIEW_MODE_CHANGED', mode: 'grid' });
      }

      // Prepare grid container
      const mainContainer = findMainContainer();
      if (!mainContainer) {
        throw new Error('Could not find offers container');
      }

      // Set grid properties for sorting
      mainContainer.style.setProperty("display", "grid", "important");
      mainContainer.style.gridTemplateAreas = "none";
      mainContainer.style.gridAutoFlow = "row";

      // Hide carousel if present
      const carouselElement = document.querySelector('.app-page[style*="grid-column"]') as HTMLElement;
      if (carouselElement?.style) {
        carouselElement.style.display = "none";
      }

      // Scroll to "Additional Offers" section
      const additionalOffersHeader = Array.from(document.querySelectorAll("h2")).find(
        h => h.textContent?.includes("Additional Offers")
      );
      if (additionalOffersHeader) {
        additionalOffersHeader.scrollIntoView({ behavior: "smooth", block: "start" });
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Load all tiles via pagination (imported dynamically to avoid circular deps)
      console.log('[SortOrchestrator] Starting pagination...');
      setSortProgress({ type: 'pagination' });

      const { loadAllTiles } = await import('@/content/modules/pagination');
      const fullyPaginated = { value: false };
      const pagesLoaded = await loadAllTiles(fullyPaginated);

      console.log('[SortOrchestrator] Pagination complete:', pagesLoaded, 'pages');

      // Get all tiles
      const allTiles = findAllTiles();
      if (allTiles.length === 0) {
        throw new Error('No offer tiles found');
      }

      // Extract tile data
      console.log('[SortOrchestrator] Extracting tile data...');
      const tilesData = extractTilesData(allTiles);

      // Sort
      console.log('[SortOrchestrator] Sorting', tilesData.length, 'tiles...');
      setSortProgress({ type: 'sorting', totalOffers: tilesData.length });
      const sortedTiles = TileSorter.sort(tilesData, criteria, order);

      // Apply to DOM
      console.log('[SortOrchestrator] Applying sort to DOM...');
      TileSorter.applyToDOM(sortedTiles);

      const result: SortResult = {
        success: true,
        tilesProcessed: sortedTiles.length,
        pagesLoaded,
      };

      setSortResult(result);

      // If was in table view, restore it BEFORE emitting SORT_COMPLETED
      // This ensures the table is created with the correct sorted order
      if (wasInTableView) {
        console.log('[SortOrchestrator] Restoring table view...');
        await emitEvent({ type: 'VIEW_MODE_CHANGING', fromMode: 'grid', toMode: 'table' });
        setViewMode('table');
        await emitEvent({ type: 'VIEW_MODE_CHANGED', mode: 'table' });
      }

      // Emit SORT_COMPLETED after view mode is restored
      await emitEvent({ type: 'SORT_COMPLETED', tilesProcessed: sortedTiles.length, pagesLoaded });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[SortOrchestrator] Error:', error);

      const result: SortResult = {
        success: false,
        tilesProcessed: 0,
        pagesLoaded: 0,
        error: errorMsg,
      };

      setSortResult(result);
      await emitEvent({ type: 'SORT_FAILED', error: errorMsg });

      return result;
    } finally {
      this.isInProgress = false;
      setSortActive(false);
    }
  }
}
