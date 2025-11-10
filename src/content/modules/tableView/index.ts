import {
  findMainContainer,
  findAllTiles,
  extractMerchantName,
  extractMileageText,
  extractMerchantTLD,
} from '@/shared/domHelpers';

const TABLE_CONTAINER_ID = 'c1-offers-table-container';
const TABLE_ID = 'c1-offers-table';
const ITEMS_PER_PAGE = 10;

interface OfferData {
  tile: HTMLElement;
  merchantName: string;
  mileage: string;
  merchantTLD: string;
  logoUrl?: string;
  offerType?: string; // "Online", "In-Store", "In-Store & Online"
  order?: number; // CSS order property from sorting
}

let currentPage = 1;
let totalPages = 1;
let allOffers: OfferData[] = [];

/**
 * Check if favorites are enabled by looking for stars in tiles
 */
async function areFavoritesEnabled(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get('c1-favorites-enabled');
    return result['c1-favorites-enabled'] === true;
  } catch (error) {
    return false;
  }
}

/**
 * Extracts all relevant data from offer tiles
 * Respects the current sort order by reading the CSS 'order' property
 */
function extractOfferData(): OfferData[] {
  const tiles = findAllTiles();
  const offerData: OfferData[] = [];

  for (const tile of tiles) {
    // Skip hidden tiles (filtered out)
    if ((tile as HTMLElement).style.display === 'none') {
      continue;
    }

    const merchantName = extractMerchantName(tile);
    const mileage = extractMileageText(tile);
    const merchantTLD = extractMerchantTLD(tile);

    // Extract logo URL
    const imgElement = tile.querySelector('img');
    const logoUrl = imgElement?.src || '';

    // Extract offer type (Online, In-Store, etc.)
    const offerTypeElement = tile.querySelector('h2');
    const offerType = offerTypeElement?.textContent?.trim() || 'Online';

    // Get the CSS order property (used by sorting)
    const orderValue = parseInt((tile as HTMLElement).style.order || '0', 10);

    offerData.push({
      tile,
      merchantName,
      mileage,
      merchantTLD,
      logoUrl,
      offerType,
      order: orderValue,
    });
  }

  // Sort by the CSS order property to respect the current sort order
  return offerData.sort((a, b) => (a.order || 0) - (b.order || 0));
}


/**
 * Creates a table row from offer data
 */
function createTableRow(offer: OfferData, index: number, showFavorites: boolean): HTMLTableRowElement {
  const row = document.createElement('tr');
  row.style.transition = 'background-color 0.2s';
  row.dataset.tileIndex = String(index);
  row.dataset.merchantTld = offer.merchantTLD;

  row.style.position = 'relative';
  row.style.cursor = 'pointer';

  // Add hover effect
  row.addEventListener('mouseenter', () => {
    row.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
  });
  row.addEventListener('mouseleave', () => {
    row.style.backgroundColor = '';
  });

  // Store the tile's original DOM index if not already set
  // This happens ONCE on first table view, preserving original order
  if (!offer.tile.hasAttribute('data-original-position')) {
    const parent = offer.tile.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const position = siblings.indexOf(offer.tile);
      offer.tile.setAttribute('data-original-position', String(position));
    }
  }

  // Store original inline styles before modifying (only if not already stored)
  if (!offer.tile.hasAttribute('data-original-inline-styles')) {
    const originalInlineStyles = {
      position: offer.tile.style.position,
      top: offer.tile.style.top,
      left: offer.tile.style.left,
      width: offer.tile.style.width,
      height: offer.tile.style.height,
      opacity: offer.tile.style.opacity,
      pointerEvents: offer.tile.style.pointerEvents,
      zIndex: offer.tile.style.zIndex,
      display: offer.tile.style.display,
    };
    offer.tile.setAttribute('data-original-inline-styles', JSON.stringify(originalInlineStyles));
  }

  // Move the actual tile as an invisible overlay (needed for trusted clicks)
  offer.tile.style.position = 'absolute';
  offer.tile.style.top = '0';
  offer.tile.style.left = '0';
  offer.tile.style.width = '100%';
  offer.tile.style.height = '100%';
  offer.tile.style.opacity = '0';
  offer.tile.style.pointerEvents = 'auto';
  offer.tile.style.zIndex = '5';
  offer.tile.style.display = ''; // Ensure tile is visible (not 'none')

  // Merchant Name
  const merchantCell = document.createElement('td');
  merchantCell.textContent = offer.merchantName;
  merchantCell.style.padding = '12px';
  merchantCell.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
  merchantCell.style.fontWeight = '600';
  merchantCell.style.position = 'relative';
  merchantCell.style.zIndex = '1';
  merchantCell.style.pointerEvents = 'none';
  merchantCell.style.overflow = 'hidden';
  merchantCell.style.textOverflow = 'ellipsis';
  merchantCell.style.whiteSpace = 'nowrap';
  row.appendChild(merchantCell);

  // Mileage
  const mileageCell = document.createElement('td');
  mileageCell.textContent = offer.mileage;
  mileageCell.style.padding = '12px';
  mileageCell.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
  mileageCell.style.color = 'rgb(37, 129, 14)';
  mileageCell.style.fontWeight = '600';
  mileageCell.style.textAlign = 'center';
  mileageCell.style.width = '180px';
  mileageCell.style.position = 'relative';
  mileageCell.style.zIndex = '1';
  mileageCell.style.pointerEvents = 'none';
  mileageCell.style.whiteSpace = 'nowrap';
  row.appendChild(mileageCell);

  // View Offer button (entire row is clickable via clone overlay)
  const actionCell = document.createElement('td');
  actionCell.style.padding = '12px';
  actionCell.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
  actionCell.style.textAlign = 'center';
  actionCell.style.width = '180px';
  actionCell.style.position = 'relative';
  actionCell.style.zIndex = '1';
  actionCell.style.pointerEvents = 'none';

  const viewButton = document.createElement('button');
  viewButton.textContent = 'View Offer';
  viewButton.style.backgroundColor = 'rgb(37, 129, 14)';
  viewButton.style.color = 'white';
  viewButton.style.border = 'none';
  viewButton.style.padding = '8px 16px';
  viewButton.style.borderRadius = '4px';
  viewButton.style.fontWeight = '600';
  viewButton.style.fontSize = '14px';
  viewButton.style.pointerEvents = 'none';

  actionCell.appendChild(viewButton);
  row.appendChild(actionCell);

  // Favorite star (only if favorites are enabled)
  if (showFavorites) {
    const starCell = document.createElement('td');
    starCell.style.padding = '12px';
    starCell.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    starCell.style.textAlign = 'center';
    starCell.style.width = '50px';
    starCell.style.position = 'relative';
    starCell.style.zIndex = '20'; // Higher than clone overlay so star is clickable
    starCell.style.pointerEvents = 'auto';

    // Check if the original tile has a star button
    const starButton = offer.tile.querySelector('[data-c1-favorite-star]') as HTMLElement;
    if (starButton) {
      // Clone the star button
      const starClone = starButton.cloneNode(true) as HTMLElement;

      // Ensure the clone has all the data attributes from the original
      starClone.setAttribute('data-c1-favorite-star', starButton.getAttribute('data-c1-favorite-star') || 'true');
      starClone.setAttribute('data-merchant-tld', starButton.getAttribute('data-merchant-tld') || offer.merchantTLD);
      starClone.setAttribute('data-merchant-name', starButton.getAttribute('data-merchant-name') || offer.merchantName);
      starClone.setAttribute('data-favorited', starButton.getAttribute('data-favorited') || 'false');
      starClone.textContent = starButton.textContent;
      starClone.setAttribute('aria-label', starButton.getAttribute('aria-label') || '');
      starClone.setAttribute('title', starButton.getAttribute('title') || '');

      // Override styles for dark mode table view
      const isFavorited = starButton.getAttribute('data-favorited') === 'true';
      starClone.style.cssText = `
        background: transparent;
        border: none;
        border-radius: 0;
        width: auto;
        height: auto;
        display: inline-block;
        cursor: pointer;
        font-size: 24px;
        line-height: 1;
        padding: 4px;
        z-index: 10;
        box-shadow: none;
        transition: transform 0.2s ease, filter 0.2s ease;
        color: ${isFavorited ? '#FFD700' : 'transparent'};
        -webkit-text-stroke: 0.5px white;
      `;

      // Add hover effect
      starClone.addEventListener('mouseenter', () => {
        starClone.style.transform = 'scale(1.2)';
        starClone.style.filter = 'drop-shadow(0 2px 4px rgba(255, 255, 255, 0.3))';
      });
      starClone.addEventListener('mouseleave', () => {
        starClone.style.transform = 'scale(1)';
        starClone.style.filter = 'none';
      });

      // Create a click handler that directly toggles the favorite
      const handleStarClick = async (e: Event) => {
        e.stopPropagation();
        e.preventDefault();

        const merchantTLD = starClone.getAttribute('data-merchant-tld');
        const merchantName = starClone.getAttribute('data-merchant-name');
        if (!merchantTLD || !merchantName) return;

        const mileageValue = offer.mileage;

        // Import toggleFavorite dynamically
        const { toggleFavorite } = await import('@/shared/favoritesHelpers');
        const nowFavorited = await toggleFavorite(merchantTLD, merchantName, mileageValue);

        // Update the clone
        starClone.textContent = nowFavorited ? "★" : "☆";
        starClone.setAttribute('data-favorited', nowFavorited ? "true" : "false");
        starClone.setAttribute(
          "aria-label",
          nowFavorited ? "Unfavorite offer" : "Favorite offer"
        );
        starClone.setAttribute(
          "title",
          nowFavorited ? "Remove from favorites" : "Add to favorites"
        );
        // Update the color for filled (yellow) vs outline (transparent)
        starClone.style.color = nowFavorited ? '#FFD700' : 'transparent';

        // Update the original star as well
        starButton.textContent = nowFavorited ? "★" : "☆";
        starButton.setAttribute('data-favorited', nowFavorited ? "true" : "false");
        starButton.setAttribute(
          "aria-label",
          nowFavorited ? "Unfavorite offer" : "Favorite offer"
        );
        starButton.setAttribute(
          "title",
          nowFavorited ? "Remove from favorites" : "Add to favorites"
        );
      };

      starClone.addEventListener('click', handleStarClick);

      starCell.appendChild(starClone);
    }

    row.appendChild(starCell);
  }

  // Append the invisible tile overlay last (after all cells)
  row.appendChild(offer.tile);

  return row;
}

/**
 * Creates the table structure
 */
function createTable(offers: OfferData[], showFavorites: boolean): HTMLTableElement {
  const table = document.createElement('table');
  table.id = TABLE_ID;
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.backgroundColor = '#1a1a1a';
  table.style.color = 'white';

  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
  headerRow.style.borderBottom = '2px solid rgba(255, 255, 255, 0.2)';

  const headers = showFavorites ? ['Merchant', 'Mileage', 'Action', '★'] : ['Merchant', 'Mileage', 'Action'];
  headers.forEach((headerText) => {
    const th = document.createElement('th');
    th.textContent = headerText;
    th.style.padding = '16px 12px';
    th.style.textAlign = (headerText === 'Mileage' || headerText === 'Action') ? 'center' : 'left';
    th.style.fontWeight = '700';
    th.style.fontSize = '14px';
    th.style.textTransform = 'uppercase';
    th.style.letterSpacing = '0.5px';
    th.style.color = 'rgba(255, 255, 255, 0.9)';
    if (headerText === '★') {
      th.style.textAlign = 'center';
      th.style.width = '50px';
    }
    if (headerText === 'Mileage') {
      th.style.width = '180px';
    }
    if (headerText === 'Action') {
      th.style.width = '180px';
    }
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create body
  const tbody = document.createElement('tbody');
  offers.forEach((offer, index) => {
    const row = createTableRow(offer, index, showFavorites);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  return table;
}

/**
 * Creates pagination controls
 */
function createPaginationControls(): HTMLDivElement {
  const controls = document.createElement('div');
  controls.id = 'c1-table-pagination';
  controls.style.display = 'flex';
  controls.style.justifyContent = 'space-between';
  controls.style.alignItems = 'center';
  controls.style.padding = '20px';
  controls.style.backgroundColor = '#1a1a1a';
  controls.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
  controls.style.color = 'white';

  // Page info
  const pageInfo = document.createElement('div');
  pageInfo.id = 'c1-page-info';
  pageInfo.style.fontSize = '14px';
  pageInfo.style.color = 'rgba(255, 255, 255, 0.7)';
  updatePageInfo(pageInfo);
  controls.appendChild(pageInfo);

  // Buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.gap = '10px';
  buttonsContainer.style.alignItems = 'center';

  // Previous button
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

  // Page number input container
  const pageInputContainer = document.createElement('div');
  pageInputContainer.style.display = 'flex';
  pageInputContainer.style.alignItems = 'center';
  pageInputContainer.style.gap = '8px';
  pageInputContainer.style.fontSize = '14px';
  pageInputContainer.style.color = 'rgba(255, 255, 255, 0.7)';

  const pageLabel = document.createElement('span');
  pageLabel.textContent = 'Page';
  pageInputContainer.appendChild(pageLabel);

  const pageInput = document.createElement('input');
  pageInput.type = 'number';
  pageInput.min = '1';
  pageInput.max = String(totalPages);
  pageInput.value = String(currentPage);
  pageInput.id = 'c1-page-input';
  pageInput.style.cssText = `
    width: 60px;
    padding: 6px 8px;
    background-color: rgba(255, 255, 255, 0.08);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
  `;

  pageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const targetPage = parseInt(pageInput.value, 10);
      if (targetPage >= 1 && targetPage <= totalPages) {
        currentPage = targetPage;
        renderCurrentPage();
      } else {
        pageInput.value = String(currentPage);
      }
      // Remove focus from input so first click on offers works immediately
      pageInput.blur();
    }
  });

  pageInput.addEventListener('blur', () => {
    const targetPage = parseInt(pageInput.value, 10);
    if (targetPage >= 1 && targetPage <= totalPages) {
      currentPage = targetPage;
      renderCurrentPage();
    } else {
      pageInput.value = String(currentPage);
    }
  });

  pageInputContainer.appendChild(pageInput);

  const ofLabel = document.createElement('span');
  ofLabel.textContent = `of ${totalPages}`;
  ofLabel.id = 'c1-total-pages-label';
  pageInputContainer.appendChild(ofLabel);

  buttonsContainer.appendChild(pageInputContainer);

  // Next button
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
  button.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
  button.style.color = 'white';
  button.style.border = '1px solid rgba(255, 255, 255, 0.15)';
  button.style.padding = '8px 16px';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.style.fontWeight = '600';
  button.style.fontSize = '14px';
  button.style.transition = 'all 0.2s';

  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
  });
}

function updatePageInfo(pageInfo: HTMLElement): void {
  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, allOffers.length);
  pageInfo.textContent = `Showing ${start}-${end} of ${allOffers.length} offers (Page ${currentPage} of ${totalPages})`;
}

function updatePaginationButtons(): void {
  const prevButton = document.getElementById('c1-prev-page') as HTMLButtonElement;
  const nextButton = document.getElementById('c1-next-page') as HTMLButtonElement;
  const pageInfo = document.getElementById('c1-page-info');
  const pageInput = document.getElementById('c1-page-input') as HTMLInputElement;
  const totalPagesLabel = document.getElementById('c1-total-pages-label');

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

  if (pageInput) {
    pageInput.value = String(currentPage);
    pageInput.max = String(totalPages);
  }

  if (totalPagesLabel) {
    totalPagesLabel.textContent = `of ${totalPages}`;
  }
}

async function renderCurrentPage(): Promise<void> {
  const tableContainer = document.getElementById(TABLE_CONTAINER_ID);
  if (!tableContainer) return;

  const mainContainer = findMainContainer();
  if (!mainContainer) return;

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageOffers = allOffers.slice(start, end);

  const showFavorites = await areFavoritesEnabled();

  // Update table container width based on whether favorites are shown
  tableContainer.style.maxWidth = showFavorites ? '1500px' : '1400px';

  // Before removing existing table, move tiles back to main container
  const existingTable = document.getElementById(TABLE_ID);
  if (existingTable) {
    const tilesInOldTable = Array.from(existingTable.querySelectorAll('[data-testid^="feed-tile-"]')) as HTMLElement[];

    // Reset each tile and move to main container
    tilesInOldTable.forEach(tile => {
      // Restore original inline styles
      const originalStylesStr = tile.getAttribute('data-original-inline-styles');
      if (originalStylesStr) {
        try {
          const originalStyles = JSON.parse(originalStylesStr);
          tile.style.position = originalStyles.position;
          tile.style.top = originalStyles.top;
          tile.style.left = originalStyles.left;
          tile.style.width = originalStyles.width;
          tile.style.height = originalStyles.height;
          tile.style.opacity = originalStyles.opacity;
          tile.style.pointerEvents = originalStyles.pointerEvents;
          tile.style.zIndex = originalStyles.zIndex;
          tile.style.display = 'none'; // Hide it in the main container during pagination
        } catch (e) {
          console.warn('[Table View] Failed to restore styles during pagination:', e);
        }
      }
      mainContainer.appendChild(tile);
    });

    existingTable.remove();
  }

  // Create and insert new table
  const table = createTable(pageOffers, showFavorites);
  const paginationControls = document.getElementById('c1-table-pagination');
  if (paginationControls) {
    tableContainer.insertBefore(table, paginationControls);
  } else {
    tableContainer.appendChild(table);
  }

  updatePaginationButtons();
}

/**
 * Refreshes the current table to reflect updated favorites state, sorting, or filtering
 * Re-extracts offer data to pick up any changes from filtering or sorting
 */
export async function refreshTableView(): Promise<void> {
  if (!isTableViewActive()) {
    return;
  }

  console.log('[Table View] Refreshing table to reflect changes');

  const tableContainer = document.getElementById(TABLE_CONTAINER_ID);
  if (!tableContainer) return;

  const showFavorites = await areFavoritesEnabled();

  // Update table container width based on whether favorites are shown
  tableContainer.style.maxWidth = showFavorites ? '1500px' : '1400px';

  // If favorites are being enabled, make sure ALL tiles in allOffers have stars
  if (showFavorites && allOffers.length > 0) {
    // Check if any tiles are missing stars
    const tilesNeedingStars = allOffers.filter(offer => !offer.tile.querySelector('[data-c1-favorite-star]'));
    console.log('[Table View] Tiles needing stars:', tilesNeedingStars.length, 'out of', allOffers.length);

    if (tilesNeedingStars.length > 0) {
      // Stars haven't been injected yet - wait a bit longer
      console.log('[Table View] Waiting for star injection to complete...');
      await new Promise(resolve => setTimeout(resolve, 200));

      // Check again after waiting
      const stillNeedingStars = allOffers.filter(offer => !offer.tile.querySelector('[data-c1-favorite-star]'));
      console.log('[Table View] After waiting, tiles still needing stars:', stillNeedingStars.length);
    }
  }

  // Re-extract offer data to pick up any changes from filtering or sorting
  // This ensures we only show visible tiles (respecting favorites filter)
  // and respect the current sort order (CSS order property)
  const previousLength = allOffers.length;
  allOffers = extractOfferData();
  console.log('[Table View] Re-extracted offers:', allOffers.length, '(was:', previousLength + ')');

  // Recalculate pagination based on new offer count
  totalPages = Math.ceil(allOffers.length / ITEMS_PER_PAGE);

  // If current page is now out of bounds, go to last page
  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  }

  // Re-render the current page
  await renderCurrentPage();
}

/**
 * Checks if table view is currently active
 */
export function isTableViewActive(): boolean {
  return !!document.getElementById(TABLE_CONTAINER_ID);
}

/**
 * Applies table view by hiding grid and showing table
 */
export async function applyTableView(): Promise<{ success: boolean; offersShown: number; error?: string }> {
  try {
    const mainContainer = findMainContainer();
    if (!mainContainer) {
      return {
        success: false,
        offersShown: 0,
        error: 'Could not find offers container',
      };
    }

    // Ensure main container is visible before extracting tiles
    // (in case it was hidden from a previous table view)
    mainContainer.style.display = '';
    mainContainer.removeAttribute('data-original-display');

    // Clean up any leftover table artifacts from previous toggles
    // The main container still has the original tiles (it was just hidden)
    // But we may have orphaned tiles in a leftover table container
    const existingTableContainer = document.getElementById(TABLE_CONTAINER_ID);
    if (existingTableContainer) {
      existingTableContainer.remove();
    }

    // Extract offer data
    allOffers = extractOfferData();
    console.log('[Table View] Extracted offers:', allOffers.length, 'First 3:', allOffers.slice(0, 3).map(o => o.merchantName));
    if (allOffers.length === 0) {
      return {
        success: false,
        offersShown: 0,
        error: 'No offers found to display in table',
      };
    }

    // Calculate pagination
    currentPage = 1;
    totalPages = Math.ceil(allOffers.length / ITEMS_PER_PAGE);

    // Check if favorites are enabled
    const showFavorites = await areFavoritesEnabled();

    // Hide the entire main container to preserve all tiles in their original positions
    // Store the original display value so we can restore it
    const originalMainContainerDisplay = mainContainer.style.display;
    mainContainer.setAttribute('data-original-display', originalMainContainerDisplay);
    mainContainer.style.display = 'none';

    // Create fresh table container
    const tableContainer = document.createElement('div');
    tableContainer.id = TABLE_CONTAINER_ID;
    tableContainer.style.width = '100%';
    tableContainer.style.maxWidth = showFavorites ? '1500px' : '1400px';
    tableContainer.style.margin = '0 auto';
    tableContainer.style.padding = '20px';
    tableContainer.style.backgroundColor = '#1a1a1a';
    tableContainer.style.borderRadius = '8px';
    mainContainer.parentElement?.insertBefore(tableContainer, mainContainer);

    // Get first page of offers
    const firstPageOffers = allOffers.slice(0, ITEMS_PER_PAGE);

    // Create and append table
    const table = createTable(firstPageOffers, showFavorites);
    tableContainer.appendChild(table);

    // Add pagination controls
    const paginationControls = createPaginationControls();
    tableContainer.appendChild(paginationControls);

    return {
      success: true,
      offersShown: allOffers.length,
    };
  } catch (error) {
    console.error('[Table View] Error:', error);
    return {
      success: false,
      offersShown: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Removes table view and restores grid
 * Optimized for performance with batched DOM operations
 */
export async function removeTableView(): Promise<{ success: boolean; error?: string }> {
  try {
    const mainContainer = findMainContainer();
    if (!mainContainer) {
      return {
        success: false,
        error: 'Could not find offers container',
      };
    }

    // Collect ALL tiles from both table container and main container
    const tableContainer = document.getElementById(TABLE_CONTAINER_ID);
    const allTiles: HTMLElement[] = [];

    // Get tiles from table container
    if (tableContainer) {
      const tilesInTable = Array.from(tableContainer.querySelectorAll('[data-testid^="feed-tile-"]')) as HTMLElement[];
      allTiles.push(...tilesInTable);
    }

    // Get tiles from main container (that were moved back during pagination)
    const tilesInMain = Array.from(mainContainer.querySelectorAll('[data-testid^="feed-tile-"]')) as HTMLElement[];
    allTiles.push(...tilesInMain);

    console.log('[Table View] Restoring', allTiles.length, 'tiles');

    // Sort ALL tiles by their original position
    const tilesWithPosition = allTiles.map(tile => {
      const posStr = tile.getAttribute('data-original-position');
      const position = posStr ? parseInt(posStr, 10) : 999999;
      return { tile, position };
    });
    tilesWithPosition.sort((a, b) => a.position - b.position);

    // PERFORMANCE OPTIMIZATION: Use DocumentFragment for batched DOM operations
    // This prevents multiple reflows/repaints
    const fragment = document.createDocumentFragment();

    // Restore all tiles' styles and add to fragment
    tilesWithPosition.forEach(({ tile }) => {
      // Restore original inline styles
      const originalStylesStr = tile.getAttribute('data-original-inline-styles');
      if (originalStylesStr) {
        try {
          const originalStyles = JSON.parse(originalStylesStr);
          tile.style.position = originalStyles.position;
          tile.style.top = originalStyles.top;
          tile.style.left = originalStyles.left;
          tile.style.width = originalStyles.width;
          tile.style.height = originalStyles.height;
          tile.style.opacity = originalStyles.opacity;
          tile.style.pointerEvents = originalStyles.pointerEvents;
          tile.style.zIndex = originalStyles.zIndex;
          tile.style.display = originalStyles.display;
        } catch (e) {
          console.warn('[Table View] Failed to restore styles:', e);
        }
      }

      // Add tile to fragment (detaches it from current parent)
      fragment.appendChild(tile);
    });

    // Single DOM operation: append all tiles at once
    // This triggers only ONE reflow instead of hundreds
    mainContainer.appendChild(fragment);

    // Remove table container
    if (tableContainer) {
      tableContainer.remove();
    }

    // Restore the main container's display property to show the grid
    const originalDisplay = mainContainer.getAttribute('data-original-display');
    mainContainer.style.display = originalDisplay || '';
    mainContainer.removeAttribute('data-original-display');

    return {
      success: true,
    };
  } catch (error) {
    console.error('[Table View] Error removing table:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
