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

  // Temporarily clear ALL inline display:none (including from favorites filter and pagination)
  // We need to extract ALL tiles regardless of current filter state
  const tilesWithDisplayNone: Array<{ tile: HTMLElement; priority: string }> = [];
  uniqueTiles.forEach(tile => {
    if (tile.style.display === 'none') {
      const priority = tile.style.getPropertyPriority('display');
      tilesWithDisplayNone.push({ tile, priority });
      tile.style.removeProperty('display');
    }
  });

  const offerData: OfferData[] = [];

  for (const tile of uniqueTiles) {
    // Extract data from ALL tiles - don't skip any based on display state
    // The favorites filter will be re-applied after table refresh

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

  // Restore display:none to tiles that had it (with original priority)
  tilesWithDisplayNone.forEach(({ tile, priority }) => {
    tile.style.setProperty('display', 'none', priority);
  });

  // Sort by CSS order property to respect current sort
  return offerData.sort((a, b) => (a.order || 0) - (b.order || 0));
}
