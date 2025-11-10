/**
 * Extract data from offer tiles
 */

import { SELECTORS } from '@/utils/constants';

const MULTIPLIER_PATTERN = /(\d+)X\s+miles/i;
const MILES_PATTERN = /(?:Up to )?([0-9,]+)\s+miles/i;
const MAX_BASE64_LENGTH = 10000;
const VALID_TLD_PATTERN = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

/**
 * Validate merchant TLD format
 */
export function isValidMerchantTLD(tld: unknown): tld is string {
  if (typeof tld !== 'string') return false;
  if (tld.length === 0 || tld.length > 100) return false;
  if (tld.includes('..')) return false;
  if (tld.startsWith('.') || tld.startsWith('-')) return false;
  if (tld.endsWith('.') || tld.endsWith('-')) return false;
  return VALID_TLD_PATTERN.test(tld);
}

/**
 * Extract merchant TLD from data-testid (Base64 encoded JSON)
 */
function extractMerchantTLDFromDataTestId(tile: HTMLElement): string {
  const dataTestId = tile.getAttribute("data-testid");
  if (!dataTestId || !dataTestId.startsWith("feed-tile-")) {
    return "";
  }

  try {
    const base64Part = dataTestId.replace(/^feed-tile-/, "");

    if (!base64Part || base64Part.length > MAX_BASE64_LENGTH) {
      return "";
    }

    // Validate Base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Part)) {
      return "";
    }

    const jsonString = atob(base64Part);
    const data: any = JSON.parse(jsonString);

    // Validate structure
    if (!data || typeof data !== 'object' || !data.inventory) {
      return "";
    }

    const merchantTLD = data.inventory.merchantTLD;

    if (isValidMerchantTLD(merchantTLD)) {
      return merchantTLD as string;
    }

    return "";
  } catch (error) {
    return "";
  }
}

/**
 * Extract merchant TLD from tile (multiple fallback strategies)
 */
export function extractMerchantTLD(tile: HTMLElement): string {
  // Strategy 1: data-testid
  const tldFromDataTestId = extractMerchantTLDFromDataTestId(tile);
  if (tldFromDataTestId) {
    return tldFromDataTestId;
  }

  // Strategy 2: image src with domain parameter
  const img = tile.querySelector("img");
  if (img && img.src) {
    try {
      const url = new URL(img.src);
      const domain = url.searchParams.get("domain");
      if (domain) {
        return domain;
      }
    } catch (e) {
      // Ignore
    }
  }

  // Strategy 3: link href with merchantTLD parameter
  const link = tile.querySelector("a[href]");
  if (link) {
    try {
      const href = link.getAttribute("href");
      if (href && href.includes("merchantTLD=")) {
        const match = href.match(/merchantTLD=([^&]+)/);
        if (match) {
          return decodeURIComponent(match[1]);
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  return "";
}

/**
 * Convert domain name to display-friendly name
 * Examples: crocs.com → Crocs, cumberlandfarms.com → Cumberland Farms
 */
export function domainToDisplayName(domain: string): string {
  if (!domain) {
    return "Unknown Merchant";
  }

  const nameWithoutTLD = domain.replace(/\.(com|net|org|co\.uk|io|app|store|ca|us)$/i, "");

  const words = nameWithoutTLD
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter(w => w.length > 0);

  const capitalized = words.map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );

  return capitalized.join(" ");
}

/**
 * Extract merchant name from tile
 */
export function extractMerchantName(tile: HTMLElement): string {
  const merchantTLD = extractMerchantTLD(tile);
  if (merchantTLD) {
    return domainToDisplayName(merchantTLD);
  }
  return "Unknown Merchant";
}

/**
 * Extract mileage text from tile
 */
export function extractMileageText(tile: HTMLElement): string {
  // Use style attribute for mileage (green color: rgb(37, 129, 14))
  const mileageDiv = tile.querySelector(SELECTORS.mileageText) as HTMLElement;
  if (mileageDiv?.textContent) {
    return mileageDiv.textContent.trim();
  }

  return "0 miles";
}

/**
 * Parse mileage value from text to number
 */
export function parseMileageValue(text: string): number {
  const cleanedText = text.replace(/\*/g, "").trim();

  // Check for multiplier pattern (e.g., "5X miles")
  const multiplierMatch = cleanedText.match(MULTIPLIER_PATTERN);
  if (multiplierMatch) {
    return parseInt(multiplierMatch[1], 10) * 1000;
  }

  // Check for miles pattern (e.g., "5,000 miles")
  const milesMatch = cleanedText.match(MILES_PATTERN);
  if (milesMatch) {
    return parseInt(milesMatch[1].replace(/,/g, ""), 10);
  }

  return 0;
}
