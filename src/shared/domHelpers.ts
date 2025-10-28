/**
 * DOM Helper Functions
 * Shared utilities for extracting data from Capital One offer tiles.
 */
const MILEAGE_PATTERN = /\d+[,\d]*\s*(?:X\s*)?miles/i;
const MULTIPLIER_PATTERN = /(\d+)X\s+miles/i;
const MILES_PATTERN = /(?:Up to )?([0-9,]+)\s+miles/i;
const MAX_BASE64_LENGTH = 10000;
const VALID_TLD_PATTERN = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

/**
 * Checks if a tile is a skeleton tile (loading placeholder)
 */
export function isSkeletonTile(tile: Element): boolean {
  const testId = tile.getAttribute('data-testid') || '';
  return testId.includes('skeleton');
}

/**
 * Checks if a tile is a carousel tile
 */
export function isCarouselTile(tile: Element): boolean {
  const testId = tile.getAttribute('data-testid') || '';
  return testId.includes('carousel');
}

/**
 * Checks if a tile should be excluded from processing
 */
export function shouldExcludeTile(tile: Element): boolean {
  return isSkeletonTile(tile) || isCarouselTile(tile);
}

/**
 * Counts only real tiles (excluding skeletons and carousels)
 */
export function countRealTiles(): number {
  const allTiles = document.querySelectorAll('[data-testid^="feed-tile-"]');
  let count = 0;
  for (const tile of allTiles) {
    if (!shouldExcludeTile(tile)) {
      count++;
    }
  }
  return count;
}

/**
 * Validates merchantTLD format for security
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
 * Extracts merchantTLD from tile's data-testid attribute with security validation
 */
export function extractMerchantTLDFromDataTestId(tile: HTMLElement): string {
  const dataTestId = tile.getAttribute("data-testid");
  if (!dataTestId || !dataTestId.startsWith("feed-tile-")) {
    return "";
  }

  try {
    const base64Part = dataTestId.replace(/^feed-tile-/, "");

    if (!base64Part || base64Part.length > MAX_BASE64_LENGTH) {
      console.warn("[Security] Base64 data exceeds maximum length");
      return "";
    }

    const jsonString = atob(base64Part);
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== 'object') {
      console.warn("[Security] Invalid data structure");
      return "";
    }

    if (!data.inventory || typeof data.inventory !== 'object') {
      return "";
    }

    const merchantTLD = data.inventory.merchantTLD;

    if (isValidMerchantTLD(merchantTLD)) {
      return merchantTLD;
    }

    console.warn("[Security] Invalid merchantTLD format:", merchantTLD);
    return "";
  } catch (error) {
    return "";
  }
}

/**
 * Extracts merchantTLD from tile element
 * Primary: data-testid (most reliable)
 * Fallback: img src domain parameter
 */
export function extractMerchantTLD(tile: HTMLElement): string {
  const tldFromDataTestId = extractMerchantTLDFromDataTestId(tile);
  if (tldFromDataTestId) {
    return tldFromDataTestId;
  }

  const img = tile.querySelector("img");
  if (img && img.src) {
    try {
      const url = new URL(img.src);
      const domain = url.searchParams.get("domain");
      if (domain) {
        return domain;
      }
    } catch (e) {
    }
  }

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
    }
  }

  return "";
}

/**
 * Converts domain name to display-friendly name
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
 * Extracts merchant name from tile element
 * Uses merchantTLD and converts to display name
 */
export function extractMerchantName(tile: HTMLElement): string {
  const merchantTLD = extractMerchantTLD(tile);
  if (merchantTLD) {
    return domainToDisplayName(merchantTLD);
  }
  return "Unknown Merchant";
}

/**
 * Extracts mileage text from an offer tile element
 */
export function extractMileageText(tile: HTMLElement): string {
  let mileageText = "0 miles";

  const walker = document.createTreeWalker(
    tile,
    NodeFilter.SHOW_TEXT,
    null
  );
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent || "";
    if (MILEAGE_PATTERN.test(text)) {
      mileageText = text;
      break;
    }
  }

  if (mileageText === "0 miles") {
    const mileageDiv =
      tile.querySelector('div.border-none.bg-none[class*="font-semibold"]') ||
      tile.querySelector('div[style*="color: rgb(37, 129, 14)"]');
    mileageText = mileageDiv ? mileageDiv.textContent || "0 miles" : "0 miles";
  }

  return mileageText;
}

/**
 * Parses mileage value from text string
 */
export function parseMileageValue(text: string): number {
  const cleanedText = text.replace(/\*/g, "").trim();

  const multiplierMatch = cleanedText.match(MULTIPLIER_PATTERN);
  if (multiplierMatch) {
    return parseInt(multiplierMatch[1], 10) * 1000;
  }

  const milesMatch = cleanedText.match(MILES_PATTERN);
  if (milesMatch) {
    return parseInt(milesMatch[1].replace(/,/g, ""), 10);
  }

  return 0;
}

/**
 * Finds the main container holding offer tiles
 * Multi-strategy fallback approach
 */
export function findMainContainer(): HTMLElement | null {
  const firstTile = document.querySelector('[data-testid^="feed-tile-"]');
  if (firstTile && firstTile.parentElement) {
    const container = firstTile.parentElement;
    const tilesInContainer = container.querySelectorAll('[data-testid^="feed-tile-"]');
    if (tilesInContainer.length > 1) {
      return container as HTMLElement;
    }
  }

  const heading = Array.from(document.querySelectorAll("h2")).find(
    h => h.textContent && h.textContent.includes("Additional Offers")
  );
  if (heading) {
    const parent = heading.parentElement;
    const gridInParent = parent ? parent.querySelector('[class*="grid"]') : null;
    if (gridInParent) return gridInParent as HTMLElement;
  }

  const containers = Array.from(document.querySelectorAll('[class*="grid"]'));
  for (const container of containers) {
    const tiles = container.querySelectorAll('[data-testid^="feed-tile-"]');
    if (tiles.length > 10) {
      return container as HTMLElement;
    }
  }

  return document.querySelector('[class*="grid"][class*="gap"][class*="h-full"][class*="w-full"]') as HTMLElement | null;
}

/**
 * Finds the "View More Offers" pagination button
 */
export function findViewMoreButton(): HTMLButtonElement | null {
  let button = Array.from(document.querySelectorAll("button")).find(
    btn => btn.textContent && btn.textContent.trim() === "View More Offers"
  );
  if (button) return button as HTMLButtonElement;

  button = Array.from(document.querySelectorAll("button")).find(
    btn => btn.textContent && btn.textContent.includes("View More")
  );
  return (button as HTMLButtonElement) || null;
}
