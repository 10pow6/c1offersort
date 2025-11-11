/**
 * High-level controller for table view operations
 * Coordinates: enable, disable, refresh
 */

import type { TableViewResult } from './tableView.types';
import { extractOfferData } from './OfferDataExtractor';
import { createTable } from './TableRenderer';
import { restoreTileState } from './TileOverlayManager';
import { findMainContainer } from '@/platform/dom/DOMQueries';
import { emitEvent } from '@/core/events/events.types';

const TABLE_CONTAINER_ID = 'c1-offers-table-container';
const TABLE_ID = 'c1-offers-table';
const ITEMS_PER_PAGE = 10;

// Internal state
let currentPage = 1;
let totalPages = 1;
let allOffers: any[] = [];
let filteredOffers: any[] = []; // Filtered offers based on favorites filter
let isApplying = false;

/**
 * Check if table view is currently active
 */
export function isTableViewActive(): boolean {
  return !!document.getElementById(TABLE_CONTAINER_ID);
}

/**
 * Enable table view
 */
export async function applyTableView(): Promise<TableViewResult> {
  if (isApplying) {
    console.warn('[TableViewController] applyTableView already in progress, skipping');
    return { success: false, error: 'Table view application already in progress' };
  }

  isApplying = true;

  try {
    const mainContainer = findMainContainer();
    if (!mainContainer) {
      return {
        success: false,
        error: 'Could not find offers container',
      };
    }

    // Clean up any leftover table
    const existingTableContainer = document.getElementById(TABLE_CONTAINER_ID);
    if (existingTableContainer) {
      existingTableContainer.remove();
    }

    // Extract offer data
    allOffers = extractOfferData();
    console.log('[TableViewController] Extracted', allOffers.length, 'offers for table view');

    if (allOffers.length === 0) {
      return {
        success: false,
        error: 'No offers found to display',
      };
    }

    // Check if favorites enabled
    const showFavorites = await (async () => {
      try {
        const result = await chrome.storage.local.get('c1-favorites-enabled');
        return result['c1-favorites-enabled'] === true;
      } catch {
        return false;
      }
    })();

    // Check if favorites filter is active and filter offers accordingly
    const favoritesFilterActive = await (async () => {
      try {
        const result = await chrome.storage.local.get('c1-favorites-filter-active');
        return result['c1-favorites-filter-active'] === true;
      } catch {
        return false;
      }
    })();

    filteredOffers = allOffers;
    if (favoritesFilterActive) {
      try {
        const { getFavorites } = await import('@/features/favorites/FavoritesStore');
        const favorites = await getFavorites();
        const favoritedTLDs = new Set(favorites.map(fav => fav.merchantTLD));
        if (favoritedTLDs.size > 0) {
          filteredOffers = allOffers.filter(offer => favoritedTLDs.has(offer.merchantTLD));
        }
      } catch {
        // If we can't get favorites, don't filter
      }
    }

    // Calculate pagination based on filtered offers
    currentPage = 1;
    totalPages = Math.ceil(filteredOffers.length / ITEMS_PER_PAGE);

    // Hide main container
    mainContainer.style.display = 'none';

    // Create table container
    const tableContainer = document.createElement('div');
    tableContainer.id = TABLE_CONTAINER_ID;
    tableContainer.style.cssText = `
      width: 100%;
      max-width: ${showFavorites ? '1500px' : '1400px'};
      margin: 0 auto;
      padding: 20px;
      background-color: #1a1a1a;
      border-radius: 8px;
    `;
    mainContainer.parentElement?.insertBefore(tableContainer, mainContainer);

    // Get first page of filtered offers
    const firstPageOffers = filteredOffers.slice(0, ITEMS_PER_PAGE);

    // Create table
    const table = await createTable(firstPageOffers, showFavorites);
    tableContainer.appendChild(table);

    // Add pagination controls
    const paginationControls = createPaginationControls();
    tableContainer.appendChild(paginationControls);

    await emitEvent({ type: 'TABLE_VIEW_ENABLED', offersShown: filteredOffers.length });

    return {
      success: true,
      offersShown: filteredOffers.length,
    };
  } catch (error) {
    console.error('[TableViewController] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    isApplying = false;
  }
}

/**
 * Disable table view and restore grid
 */
export async function removeTableView(): Promise<TableViewResult> {
  try {
    const mainContainer = findMainContainer();
    if (!mainContainer) {
      return {
        success: false,
        error: 'Could not find offers container',
      };
    }

    // Collect ALL tiles from both table and main container
    const tableContainer = document.getElementById(TABLE_CONTAINER_ID);
    const allTiles: HTMLElement[] = [];

    if (tableContainer) {
      // Get tiles from table rows (they're in the last td of each row)
      const tilesInTable = Array.from(tableContainer.querySelectorAll('[data-testid^="feed-tile-"]')) as HTMLElement[];
      console.log('[TableViewController] Found', tilesInTable.length, 'tiles in table');
      allTiles.push(...tilesInTable);
    }

    // Also check main container for any tiles that might not have been moved to table
    // This happens during pagination: tiles not on current page stay in main container
    const tilesInMain = Array.from(mainContainer.querySelectorAll('[data-testid^="feed-tile-"]')) as HTMLElement[];
    console.log('[TableViewController] Found', tilesInMain.length, 'tiles in main container');

    // Only add tiles from main that aren't already in allTiles (deduplicate)
    const tileSet = new Set(allTiles);
    tilesInMain.forEach(tile => {
      if (!tileSet.has(tile)) {
        allTiles.push(tile);
      }
    });

    console.log('[TableViewController] Total unique tiles collected:', allTiles.length);

    // Restore all tiles using DocumentFragment for batched operations
    const fragment = document.createDocumentFragment();

    allTiles.forEach(tile => {
      restoreTileState(tile);
      // Ensure display is not 'none' unless it was originally (favorites filter uses !important)
      if (tile.style.display === 'none' && tile.style.getPropertyPriority('display') !== 'important') {
        tile.style.display = '';
      }
      fragment.appendChild(tile);
    });

    mainContainer.appendChild(fragment);

    // Remove table container
    if (tableContainer) {
      tableContainer.remove();
    }

    // Restore main container display
    mainContainer.style.display = '';

    await emitEvent({ type: 'TABLE_VIEW_DISABLED' });

    return {
      success: true,
    };
  } catch (error) {
    console.error('[TableViewController] Error removing table:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Refresh table view (re-render with current data, optionally re-extract)
 * @param reExtractData - If true, re-extract data from DOM. If false, use cached allOffers.
 */
export async function refreshTableView(reExtractData: boolean = false): Promise<void> {
  if (!isTableViewActive()) {
    return;
  }

  const tableContainer = document.getElementById(TABLE_CONTAINER_ID);
  if (!tableContainer) return;

  const showFavorites = await (async () => {
    try {
      const result = await chrome.storage.local.get('c1-favorites-enabled');
      return result['c1-favorites-enabled'] === true;
    } catch {
      return false;
    }
  })();

  // Update width
  tableContainer.style.maxWidth = showFavorites ? '1500px' : '1400px';

  // Only re-extract if explicitly requested (e.g., after sort)
  if (reExtractData) {
    allOffers = extractOfferData();
  }
  // Otherwise use cached allOffers to maintain stable order

  // Check if favorites filter is active and filter offers accordingly
  const favoritesFilterActive = await (async () => {
    try {
      const result = await chrome.storage.local.get('c1-favorites-filter-active');
      return result['c1-favorites-filter-active'] === true;
    } catch {
      return false;
    }
  })();

  filteredOffers = allOffers;
  if (favoritesFilterActive) {
    try {
      const { getFavorites } = await import('@/features/favorites/FavoritesStore');
      const favorites = await getFavorites();
      const favoritedTLDs = new Set(favorites.map(fav => fav.merchantTLD));
      if (favoritedTLDs.size > 0) {
        filteredOffers = allOffers.filter(offer => favoritedTLDs.has(offer.merchantTLD));
      }
    } catch {
      // If we can't get favorites, don't filter
    }
  }

  // Calculate pagination based on filtered offers
  totalPages = Math.ceil(filteredOffers.length / ITEMS_PER_PAGE);

  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  }

  // Re-render current page
  await renderCurrentPage();

  await emitEvent({ type: 'TABLE_VIEW_REFRESHED' });
}

/**
 * Render current page
 */
async function renderCurrentPage(): Promise<void> {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  const tableContainer = document.getElementById(TABLE_CONTAINER_ID);
  if (!tableContainer) return;

  const mainContainer = findMainContainer();
  if (!mainContainer) return;

  const showFavorites = await (async () => {
    try {
      const result = await chrome.storage.local.get('c1-favorites-enabled');
      return result['c1-favorites-enabled'] === true;
    } catch {
      return false;
    }
  })();

  // Use filteredOffers which was already calculated by refreshTableView
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageOffers = filteredOffers.slice(start, end);

  // Move tiles from old table back to main container (hidden)
  const existingTable = document.getElementById(TABLE_ID);
  if (existingTable) {
    const tilesInOldTable = Array.from(existingTable.querySelectorAll('[data-testid^="feed-tile-"]')) as HTMLElement[];
    tilesInOldTable.forEach(tile => {
      tile.style.display = 'none';
      mainContainer.appendChild(tile);
    });
    existingTable.remove();
  }

  // Create new table
  const table = await createTable(pageOffers, showFavorites);
  const paginationControls = document.getElementById('c1-table-pagination');
  if (paginationControls) {
    tableContainer.insertBefore(table, paginationControls);
  } else {
    tableContainer.appendChild(table);
  }

  updatePaginationButtons();

  // Restore scroll
  window.scrollTo(scrollX, scrollY);
}

/**
 * Create pagination controls
 */
function createPaginationControls(): HTMLDivElement {
  const controls = document.createElement('div');
  controls.id = 'c1-table-pagination';
  controls.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background-color: #1a1a1a;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
  `;

  const pageInfo = document.createElement('div');
  pageInfo.id = 'c1-page-info';
  pageInfo.style.fontSize = '14px';
  pageInfo.style.color = 'rgba(255, 255, 255, 0.7)';
  updatePageInfo(pageInfo);
  controls.appendChild(pageInfo);

  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = 'display: flex; gap: 10px; align-items: center;';

  const prevButton = document.createElement('button');
  prevButton.textContent = '← Previous';
  prevButton.id = 'c1-prev-page';
  stylePageButton(prevButton);
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderCurrentPage();
    }
  });
  buttonsContainer.appendChild(prevButton);

  const nextButton = document.createElement('button');
  nextButton.textContent = 'Next →';
  nextButton.id = 'c1-next-page';
  stylePageButton(nextButton);
  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrentPage();
    }
  });
  buttonsContainer.appendChild(nextButton);

  controls.appendChild(buttonsContainer);
  return controls;
}

function stylePageButton(button: HTMLButtonElement): void {
  button.style.cssText = `
    background-color: rgba(255, 255, 255, 0.08);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
  });
}

function updatePageInfo(pageInfo: HTMLElement): void {
  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, filteredOffers.length);
  pageInfo.textContent = `Showing ${start}-${end} of ${filteredOffers.length} offers (Page ${currentPage} of ${totalPages})`;
}

function updatePaginationButtons(): void {
  const prevButton = document.getElementById('c1-prev-page') as HTMLButtonElement;
  const nextButton = document.getElementById('c1-next-page') as HTMLButtonElement;
  const pageInfo = document.getElementById('c1-page-info');

  if (prevButton) {
    prevButton.disabled = currentPage === 1;
    prevButton.style.opacity = currentPage === 1 ? '0.5' : '1';
    prevButton.style.cursor = currentPage === 1 ? 'not-allowed' : 'pointer';
  }

  if (nextButton) {
    nextButton.disabled = currentPage >= totalPages;
    nextButton.style.opacity = currentPage >= totalPages ? '0.5' : '1';
    nextButton.style.cursor = currentPage >= totalPages ? 'not-allowed' : 'pointer';
  }

  if (pageInfo) {
    updatePageInfo(pageInfo);
  }
}
