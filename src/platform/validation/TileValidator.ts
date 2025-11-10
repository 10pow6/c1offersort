/**
 * Tile data validation
 * Ensures extracted tile data meets requirements
 */

/**
 * Validate merchant TLD
 */
export function isValidMerchantTLD(tld: string): boolean {
  if (!tld || typeof tld !== 'string') {
    return false;
  }

  // Should not be empty or "unknown"
  if (tld.trim() === '' || tld === 'unknown') {
    return false;
  }

  // Should be a valid domain format (basic check)
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(tld);
}

/**
 * Validate merchant name
 */
export function isValidMerchantName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  // Should not be empty or placeholder
  const trimmed = name.trim();
  if (trimmed === '' || trimmed === 'Unknown' || trimmed === 'N/A') {
    return false;
  }

  // Should have reasonable length
  if (trimmed.length < 2 || trimmed.length > 200) {
    return false;
  }

  return true;
}

/**
 * Validate mileage value
 */
export function isValidMileageValue(mileage: string): boolean {
  if (!mileage || typeof mileage !== 'string') {
    return false;
  }

  // Should match miles or cashback format
  const milesRegex = /\d+[,\d]*\s*(?:X\s*)?miles/i;
  const cashbackRegex = /(?:up\s+to\s+)?\d+(?:\.\d+)?%\s+back/i;

  return milesRegex.test(mileage) || cashbackRegex.test(mileage);
}

/**
 * Validate parsed mileage number
 */
export function isValidParsedMileage(value: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }

  // Should be non-negative and reasonable
  if (value < 0 || value > 1000000) {
    return false;
  }

  return true;
}

/**
 * Validate tile element
 */
export function isValidTileElement(tile: any): tile is HTMLElement {
  if (!(tile instanceof HTMLElement)) {
    return false;
  }

  // Should have data-testid attribute
  const testId = tile.getAttribute('data-testid');
  if (!testId || !testId.startsWith('feed-tile-')) {
    return false;
  }

  return true;
}

/**
 * Validate complete tile data
 */
export interface TileData {
  element: HTMLElement;
  merchantTLD: string;
  merchantName: string;
  mileage: string;
  parsedMileage: number;
}

export function isValidTileData(data: Partial<TileData>): data is TileData {
  if (!data.element || !isValidTileElement(data.element)) {
    return false;
  }

  if (!data.merchantTLD || !isValidMerchantTLD(data.merchantTLD)) {
    return false;
  }

  if (!data.merchantName || !isValidMerchantName(data.merchantName)) {
    return false;
  }

  if (!data.mileage || !isValidMileageValue(data.mileage)) {
    return false;
  }

  if (data.parsedMileage === undefined || !isValidParsedMileage(data.parsedMileage)) {
    return false;
  }

  return true;
}
