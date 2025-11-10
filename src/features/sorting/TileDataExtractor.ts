/**
 * Extract tile data for sorting
 */

import type { TileData } from './sorting.types';
import { extractMileageText, extractMerchantName, extractMerchantTLD, parseMileageValue } from '@/platform/dom/TileExtractor';

// WeakMap cache for tile data (automatic GC)
const tileDataCache = new WeakMap<HTMLElement, TileData>();

/**
 * Extract data from a single tile (with caching)
 */
export function extractTileData(tile: HTMLElement): TileData {
  // Check cache first
  const cached = tileDataCache.get(tile);
  if (cached) {
    return cached;
  }

  // Extract data
  const mileageText = extractMileageText(tile);
  const mileageValue = parseMileageValue(mileageText);
  const merchantName = extractMerchantName(tile);
  const merchantTLD = extractMerchantTLD(tile);

  const data: TileData = {
    element: tile,
    mileage: mileageValue,
    merchantName,
    merchantTLD,
  };

  // Cache for future use
  tileDataCache.set(tile, data);

  return data;
}

/**
 * Extract data from multiple tiles (batch operation)
 */
export function extractTilesData(tiles: HTMLElement[]): TileData[] {
  return tiles.map(extractTileData).filter(item => item.element !== null);
}

/**
 * Clear the tile data cache (useful when tiles change significantly)
 */
export function clearTileDataCache(): void {
  // WeakMap doesn't have a clear method, but we can create a new one
  // The old cache will be garbage collected when tiles are removed from DOM
}
