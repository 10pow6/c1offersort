/**
 * Extract offer data from tiles for table view
 */

import type { OfferData } from './tableView.types';
import { findAllTiles } from '@/platform/dom/DOMQueries';
import { extractMerchantName, extractMileageText, extractMerchantTLD } from '@/platform/dom/TileExtractor';

/**
 * Extract all relevant data from offer tiles
 * Respects the current sort order by reading CSS 'order' property
 */
export function extractOfferData(): OfferData[] {
  // Get tiles from main container
  const mainTiles = findAllTiles();
  console.log('[OfferDataExtractor] Found', mainTiles.length, 'tiles in main container');

  // Also check table container if it exists (for refresh scenarios)
  const tableTiles = Array.from(document.querySelectorAll('#c1-offers-table [data-testid^="feed-tile-"]')) as HTMLElement[];
  console.log('[OfferDataExtractor] Found', tableTiles.length, 'tiles in table container');

  // Combine and deduplicate
  const tileMap = new Map<HTMLElement, boolean>();
  [...mainTiles, ...tableTiles].forEach(tile => tileMap.set(tile, true));
  const uniqueTiles = Array.from(tileMap.keys());

  // Temporarily clear inline display:none from pagination (but NOT from favorites filter)
  const tilesWithDisplayNone: HTMLElement[] = [];
  uniqueTiles.forEach(tile => {
    if (tile.style.display === 'none') {
      const priority = tile.style.getPropertyPriority('display');
      if (priority !== 'important') {
        tilesWithDisplayNone.push(tile);
        tile.style.removeProperty('display');
      }
    }
  });

  const offerData: OfferData[] = [];

  for (const tile of uniqueTiles) {
    // Skip filtered tiles (favorites filter uses !important for display:none)
    // Check both inline style priority and computed style
    if (tile.style.display === 'none' && tile.style.getPropertyPriority('display') === 'important') {
      continue;
    }

    const computedDisplay = window.getComputedStyle(tile).display;
    if (computedDisplay === 'none') {
      continue;
    }

    const merchantName = extractMerchantName(tile);
    const mileage = extractMileageText(tile);
    const merchantTLD = extractMerchantTLD(tile);

    // Extract logo URL
    const imgElement = tile.querySelector('img');
    const logoUrl = imgElement?.src || '';

    // Extract offer type
    const offerTypeElement = tile.querySelector('h2');
    const offerType = offerTypeElement?.textContent?.trim() || 'Online';

    // Get CSS order property (used by sorting)
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

  // Restore display:none to tiles that had it
  tilesWithDisplayNone.forEach(tile => {
    tile.style.display = 'none';
  });

  // Sort by CSS order property to respect current sort
  return offerData.sort((a, b) => (a.order || 0) - (b.order || 0));
}
