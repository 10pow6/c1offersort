import {
  extractMileageText,
  extractMerchantName,
  parseMileageValue,
  findMainContainer,
} from '@/shared/domHelpers';
import type { SortResult } from '@/types';
import { loadAllTiles } from '../pagination';
import { isContextInvalidatedError } from '@/utils/contextCheck';

interface TileData {
  element: HTMLElement;
  mileage: number;
  merchantName: string;
}

/**
 * Executes the sorting operation on Capital One offer tiles.
 * Loads all tiles via pagination, extracts mileage/merchant data, and reorders using CSS order property.
 *
 * @param sortCriteria - "mileage" or "alphabetical"
 * @param sortOrder - "asc" or "desc"
 * @param fullyPaginated - Reference to track if pagination is complete
 * @param processedTiles - Set to track which tiles have been processed
 * @param reinjectStarsCallback - Callback to re-inject stars after sorting
 * @param progressState - In-memory progress tracking state (optional for backwards compatibility)
 * @returns Result object with success status, tiles processed count, and any errors
 */
export async function executeSorting(
  sortCriteria: string,
  sortOrder: string,
  fullyPaginated: { value: boolean },
  processedTiles: Set<string>,
  reinjectStarsCallback: () => Promise<void>,
  progressState?: {
    sort: {
      isActive: boolean;
      progress: {
        type: "pagination" | "sorting";
        offersLoaded?: number;
        pagesLoaded?: number;
        totalOffers?: number;
      } | null;
    };
  }
): Promise<SortResult> {
  console.log('[Sorting] executeSorting called with criteria:', sortCriteria, 'order:', sortOrder);

  const mainContainer = findMainContainer();

  if (!mainContainer) {
    return {
      success: false,
      tilesProcessed: 0,
      pagesLoaded: 0,
      error: "Could not find offers container on the page. The page structure may have changed.",
    };
  }

  const carouselElement = document.querySelector('.app-page[style*="grid-column"]') as HTMLElement;
  if (carouselElement?.style) {
    carouselElement.style.display = "none";
  }

  console.log('[Sorting] Starting pagination...');
  const pagesLoaded = await loadAllTiles(fullyPaginated);
  console.log('[Sorting] Pagination complete, pages loaded:', pagesLoaded);

  const additionalOffersHeader = Array.from(document.querySelectorAll("h2")).find(
    h => h.textContent?.includes("Additional Offers")
  );
  if (additionalOffersHeader) {
    console.log('[Sorting] Scrolling to Additional Offers header');
    additionalOffersHeader.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  console.log('[Sorting] Setting grid properties on main container');
  mainContainer.style.setProperty("display", "grid", "important");
  mainContainer.style.gridTemplateAreas = "none";
  mainContainer.style.gridAutoFlow = "row";

  console.log('[Sorting] Querying for tiles...');
  const allTilesRaw = Array.from(mainContainer.querySelectorAll('[data-testid^="feed-tile-"]'));
  console.log('[Sorting] Found', allTilesRaw.length, 'raw tiles');

  const allTiles = allTilesRaw.filter((tile) => {
    const testId = tile.getAttribute('data-testid') || '';
    const isCarousel = testId.includes('carousel');
    if (isCarousel) {
      (tile as HTMLElement).style.display = 'none';
    }
    return !isCarousel;
  }) as HTMLElement[];

  console.log('[Sorting] Filtered to', allTiles.length, 'non-carousel tiles');

  if (allTiles.length === 0) {
    console.error('[Sorting] No tiles found!');
    return {
      success: false,
      tilesProcessed: 0,
      pagesLoaded: pagesLoaded,
      error: "No offer tiles found on the page. Please ensure offers are loaded before sorting.",
    };
  }

  const tilesWithData: TileData[] = allTiles
    .map((tile) => {
      const mileageText = extractMileageText(tile);
      const mileageValue = parseMileageValue(mileageText);
      const merchantName = extractMerchantName(tile);

      return {
        element: tile,
        mileage: mileageValue,
        merchantName: merchantName,
      };
    })
    .filter((item) => item.element !== null);

  // Update in-memory progress state
  if (progressState) {
    progressState.sort.progress = {
      type: 'sorting',
      totalOffers: tilesWithData.length,
    };
  }

  try {
    chrome.runtime.sendMessage({
      type: "SORTING_START",
      totalOffers: tilesWithData.length,
    }).catch(() => {});
  } catch (error) {
    if (isContextInvalidatedError(error)) {
      console.warn('[Sorting] Extension context invalidated during sorting start event');
      return {
        success: false,
        tilesProcessed: 0,
        pagesLoaded: 0,
        error: "Extension was reloaded. Please refresh the page and try again.",
      };
    }
  }

  const isDescending = sortOrder === "desc";

  console.log('[Sorting] Sorting', tilesWithData.length, 'tiles by', sortCriteria, isDescending ? 'descending' : 'ascending');
  const sortedTiles = tilesWithData.sort((a, b) => {
    if (sortCriteria === "alphabetical") {
      const nameA = a.merchantName.toLowerCase();
      const nameB = b.merchantName.toLowerCase();
      const comparison = nameA.localeCompare(nameB);
      return isDescending ? -comparison : comparison;
    } else {
      return isDescending ? b.mileage - a.mileage : a.mileage - b.mileage;
    }
  });

  console.log('[Sorting] Applying order styles to tiles...');
  sortedTiles.forEach((item, index) => {
    if (!item.element) {
      return;
    }

    item.element.style.setProperty("grid-area", "auto", "important");
    item.element.style.setProperty("order", String(index), "important");
  });

  console.log('[Sorting] Order styles applied successfully');

  processedTiles.clear();
  await reinjectStarsCallback();

  const realTilesProcessed = allTiles.filter((tile) => {
    const testId = tile.getAttribute('data-testid') || '';
    return !testId.includes('skeleton');
  }).length;

  return {
    success: true,
    tilesProcessed: realTilesProcessed,
    pagesLoaded: pagesLoaded,
  };
}
