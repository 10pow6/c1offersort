const MILEAGE_PATTERN = /\d+[,\d]*\s*(?:X\s*)?miles/i;
const MULTIPLIER_PATTERN = /(\d+)X\s+miles/i;
const MILES_PATTERN = /(?:Up to )?([0-9,]+)\s+miles/i;
const MAX_BASE64_LENGTH = 10000;
const VALID_TLD_PATTERN = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

export function isSkeletonTile(tile: Element): boolean {
  const testId = tile.getAttribute('data-testid') || '';
  return testId.includes('skeleton');
}

export function isCarouselTile(tile: Element): boolean {
  const testId = tile.getAttribute('data-testid') || '';
  return testId.includes('carousel');
}

export function shouldExcludeTile(tile: Element): boolean {
  return isSkeletonTile(tile) || isCarouselTile(tile);
}

export function countRealTiles(): number {
  const allTiles = document.querySelectorAll('[data-testid^="feed-tile-"]');
  let count = 0;
  let skeletonCount = 0;
  let carouselCount = 0;

  for (const tile of allTiles) {
    if (isSkeletonTile(tile)) {
      skeletonCount++;
    } else if (isCarouselTile(tile)) {
      carouselCount++;
    } else {
      count++;
    }
  }

  console.log('[DOMHelpers] countRealTiles:', {
    totalTiles: allTiles.length,
    realTiles: count,
    skeletonTiles: skeletonCount,
    carouselTiles: carouselCount
  });

  return count;
}

export function isValidMerchantTLD(tld: unknown): tld is string {
  if (typeof tld !== 'string') return false;
  if (tld.length === 0 || tld.length > 100) return false;
  if (tld.includes('..')) return false;
  if (tld.startsWith('.') || tld.startsWith('-')) return false;
  if (tld.endsWith('.') || tld.endsWith('-')) return false;
  return VALID_TLD_PATTERN.test(tld);
}

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

export function extractMerchantName(tile: HTMLElement): string {
  const merchantTLD = extractMerchantTLD(tile);
  if (merchantTLD) {
    return domainToDisplayName(merchantTLD);
  }
  return "Unknown Merchant";
}

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
  const allButtons = document.querySelectorAll("button");

  console.log('[DOMHelpers] Finding "View More Offers" button:', {
    totalButtons: allButtons.length,
    buttonTexts: Array.from(allButtons).slice(0, 10).map(btn => ({
      text: btn.textContent?.trim(),
      visible: btn.offsetParent !== null
    }))
  });

  let button = Array.from(allButtons).find(
    btn => btn.textContent && btn.textContent.trim() === "View More Offers"
  );

  if (button) {
    console.log('[DOMHelpers] Found exact match button:', {
      text: button.textContent?.trim(),
      visible: button.offsetParent !== null,
      disabled: button.hasAttribute('disabled')
    });
    return button as HTMLButtonElement;
  }

  button = Array.from(allButtons).find(
    btn => btn.textContent && btn.textContent.includes("View More")
  );

  if (button) {
    console.log('[DOMHelpers] Found partial match button:', {
      text: button.textContent?.trim(),
      visible: button.offsetParent !== null,
      disabled: button.hasAttribute('disabled')
    });
  } else {
    console.log('[DOMHelpers] No "View More" button found');
  }

  return (button as HTMLButtonElement) || null;
}
