/**
 * Valid Capital One Offers URLs
 *
 * The extension works on both URL patterns:
 * - /feed - Main offers feed page (has data-testid on tiles)
 * - /c1-offers - Alternative offers page (no data-testid on tiles)
 *
 * As of January 2025, both URLs use identical layouts.
 */
export const VALID_URLS = [
  "https://capitaloneoffers.com/c1-offers",
  "https://capitaloneoffers.com/feed",
] as const;

/**
 * DOM Selectors for Capital One Offers Page
 * Optimized based on actual DOM structure (verified Jan 2025)
 */
export const SELECTORS = {
  /** Main container holding all offer tiles */
  container: ".grid.gap-4.h-full.w-full",

  /** Individual offer tile wrapper */
  offerTile: ".flex.w-full.h-full.cursor-pointer",

  /** Standard tile child element (reliable marker) */
  standardTile: ".standard-tile",

  /** Mileage text element (uses green color: rgb(37, 129, 14)) */
  mileageText: 'div[style*="rgb(37, 129, 14)"]',

  /** "View More Offers" button for pagination */
  viewMoreButton: "button.text-base.justify-center.w-full.font-semibold.cursor-pointer",
} as const;

export const COLORS = {
  PRIMARY_BACKGROUND: "#013d5b",
  PRIMARY_GREEN: "#25810E",
  PRIMARY_YELLOW: "#FFDD00",
  WHITE: "#ffffff",
  ERROR_OVERLAY: "rgba(0, 0, 0, 0.9)",
} as const;
