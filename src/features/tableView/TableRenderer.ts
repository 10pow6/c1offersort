/**
 * Renders table DOM structure with optimized batched operations
 */

import type { OfferData } from './tableView.types';
import { saveTileState, applyInvisibleOverlay } from './TileOverlayManager';

const TABLE_ID = 'c1-offers-table';

/**
 * Check if favorites are enabled
 */
async function checkFavoritesEnabled(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get('c1-favorites-enabled');
    return result['c1-favorites-enabled'] === true;
  } catch (error) {
    return false;
  }
}

/**
 * Create table header
 */
function createTableHeader(showFavorites: boolean): HTMLTableSectionElement {
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
  headerRow.style.borderBottom = '2px solid rgba(255, 255, 255, 0.2)';

  const headers = showFavorites ? ['Merchant', 'Mileage', 'Action', '★'] : ['Merchant', 'Mileage', 'Action'];
  const columnWidths = showFavorites ? ['50%', '20%', '25%', '5%'] : ['50%', '25%', '25%'];

  headers.forEach((headerText, index) => {
    const th = document.createElement('th');
    th.textContent = headerText;
    th.style.padding = '16px 12px';
    th.style.textAlign = (headerText === 'Mileage' || headerText === 'Action') ? 'center' : 'left';
    th.style.fontWeight = '700';
    th.style.fontSize = '14px';
    th.style.textTransform = 'uppercase';
    th.style.letterSpacing = '0.5px';
    th.style.color = 'rgba(255, 255, 255, 0.9)';
    th.style.width = columnWidths[index];

    if (headerText === '★') {
      th.style.textAlign = 'center';
    }
    if (headerText === 'Merchant') {
      th.style.minWidth = '200px';
    }

    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  return thead;
}

/**
 * Create a single table row from offer data
 */
async function createTableRow(offer: OfferData, index: number, showFavorites: boolean): Promise<HTMLTableRowElement> {
  const row = document.createElement('tr');
  row.style.transition = 'background-color 0.2s';
  row.dataset.tileIndex = String(index);
  row.dataset.merchantTld = offer.merchantTLD;
  row.style.position = 'relative';
  row.style.cursor = 'pointer';
  row.style.height = '60px';
  row.style.maxHeight = '60px';

  // Hover effect
  row.addEventListener('mouseenter', () => {
    row.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
  });
  row.addEventListener('mouseleave', () => {
    row.style.backgroundColor = '';
  });

  // Apply the INVISIBLE OVERLAY workaround
  saveTileState(offer.tile);
  if (offer.tile.style.display === 'none') {
    offer.tile.style.display = '';
  }
  applyInvisibleOverlay(offer.tile);

  // Merchant Name cell
  const merchantCell = document.createElement('td');
  merchantCell.textContent = offer.merchantName;
  merchantCell.style.cssText = `
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-weight: 600;
    position: relative;
    z-index: 1;
    pointer-events: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
  `;
  row.appendChild(merchantCell);

  // Mileage cell
  const mileageCell = document.createElement('td');
  mileageCell.textContent = offer.mileage;
  mileageCell.style.cssText = `
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: rgb(37, 129, 14);
    font-weight: 600;
    text-align: center;
    position: relative;
    z-index: 1;
    pointer-events: none;
    white-space: nowrap;
    vertical-align: middle;
  `;
  row.appendChild(mileageCell);

  // Action cell
  const actionCell = document.createElement('td');
  actionCell.style.cssText = `
    padding: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
    position: relative;
    z-index: 1;
    pointer-events: none;
    vertical-align: middle;
  `;

  const viewButton = document.createElement('button');
  viewButton.textContent = 'View Offer';
  viewButton.style.cssText = `
    background-color: rgb(37, 129, 14);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 14px;
    pointer-events: none;
  `;

  actionCell.appendChild(viewButton);
  row.appendChild(actionCell);

  // Star cell (if favorites enabled)
  if (showFavorites) {
    const starCell = document.createElement('td');
    starCell.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      position: relative;
      z-index: 20;
      pointer-events: auto;
      vertical-align: middle;
    `;

    // Get or create star button
    let starButton = offer.tile.querySelector('.c1-favorite-star') as HTMLElement;

    if (!starButton) {
      const { createStarButton } = await import('@/features/favorites/StarButton');
      const { isFavorited } = await import('@/features/favorites/FavoritesStore');
      const isInitiallyFavorited = await isFavorited(offer.merchantTLD);
      starButton = createStarButton(offer.tile, {
        merchantTLD: offer.merchantTLD,
        merchantName: offer.merchantName,
        initiallyFavorited: isInitiallyFavorited,
      });

      const standardTile = offer.tile.querySelector('.standard-tile') as HTMLElement;
      if (standardTile) {
        standardTile.appendChild(starButton);
      } else {
        offer.tile.style.position = 'relative';
        offer.tile.appendChild(starButton);
      }
    }

    if (starButton) {
      const starClone = starButton.cloneNode(true) as HTMLElement;
      starClone.setAttribute('data-c1-favorite-star', starButton.getAttribute('data-c1-favorite-star') || 'true');
      starClone.setAttribute('data-merchant-tld', starButton.getAttribute('data-merchant-tld') || offer.merchantTLD);
      starClone.setAttribute('data-merchant-name', starButton.getAttribute('data-merchant-name') || offer.merchantName);
      starClone.setAttribute('data-favorited', starButton.getAttribute('data-favorited') || 'false');
      starClone.textContent = starButton.textContent;

      const isFavorited = starButton.getAttribute('data-favorited') === 'true';
      starClone.style.cssText = `
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 24px;
        padding: 4px;
        color: ${isFavorited ? 'white' : 'transparent'};
        -webkit-text-stroke: 1px white;
        transition: transform 0.2s ease;
      `;

      starClone.addEventListener('mouseenter', () => {
        starClone.style.transform = 'scale(1.2)';
      });
      starClone.addEventListener('mouseleave', () => {
        starClone.style.transform = 'scale(1)';
      });

      starClone.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();

        const merchantTLD = starClone.getAttribute('data-merchant-tld');
        const merchantName = starClone.getAttribute('data-merchant-name');
        if (!merchantTLD || !merchantName) return;

        const { toggleFavorite } = await import('@/features/favorites/FavoritesStore');
        const nowFavorited = await toggleFavorite(merchantTLD, merchantName, offer.mileage);

        starClone.textContent = nowFavorited ? "★" : "☆";
        starClone.setAttribute('data-favorited', nowFavorited ? "true" : "false");
        starClone.style.color = nowFavorited ? 'white' : 'transparent';

        starButton.textContent = nowFavorited ? "★" : "☆";
        starButton.setAttribute('data-favorited', nowFavorited ? "true" : "false");
      });

      starCell.appendChild(starClone);
    }

    row.appendChild(starCell);
  }

  // Wrap invisible tile in a td
  const tileCell = document.createElement('td');
  tileCell.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    overflow: hidden;
    pointer-events: none;
  `;
  tileCell.appendChild(offer.tile);
  row.appendChild(tileCell);

  return row;
}

/**
 * Create complete table structure with batched DOM operations
 */
export async function createTable(offers: OfferData[], showFavorites: boolean): Promise<HTMLTableElement> {
  // Check if favorites are enabled
  const favoritesEnabled = await checkFavoritesEnabled();
  const actualShowFavorites = showFavorites && favoritesEnabled;

  const table = document.createElement('table');
  table.id = TABLE_ID;
  table.style.cssText = `
    width: 100%;
    min-width: 100%;
    border-collapse: collapse;
    background-color: #1a1a1a;
    color: white;
    table-layout: fixed;
  `;

  // Add header
  const thead = createTableHeader(actualShowFavorites);
  table.appendChild(thead);

  // Create tbody with batched operations (DocumentFragment)
  const tbody = document.createElement('tbody');
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < offers.length; i++) {
    const row = await createTableRow(offers[i], i, actualShowFavorites);
    fragment.appendChild(row);
  }

  tbody.appendChild(fragment);
  table.appendChild(tbody);

  return table;
}
