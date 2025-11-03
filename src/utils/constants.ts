/**
 * Application-wide constants for the C1 Offers Sorter extension.
 * Includes valid URLs, pagination configuration, DOM selectors, and color theme.
 */

import type { PaginationConfig, Selectors, Colors } from "../types";

/**
 * Valid Capital One offers page URLs where the extension is allowed to operate.
 */
export const VALID_URLS = [
  "https://capitaloneoffers.com/c1-offers",
  "https://capitaloneoffers.com/feed",
] as const;

export const PAGINATION_CONFIG: PaginationConfig = {
  MAX_ATTEMPTS: 20,
  MAX_CONSECUTIVE_FAILURES: 3,
  MUTATION_TIMEOUT_MS: 5000,
  SCROLL_DELAY_MS: 300,
  BUTTON_TEXT: "View More Offers",
} as const;

export const SELECTORS: Selectors = {
  MAIN_CONTAINER: ".grid.gap-4.h-full.w-full",
  CAROUSEL: '.app-page[style*="grid-column"]',
  TILE_WRAPPER: ".flex.cursor-pointer",
  MILEAGE_PRIMARY: 'div.border-none.bg-none[class*="font-semibold"]',
  MILEAGE_SECONDARY: 'div[style*="color: rgb(37, 129, 14)"]',
} as const;

export const COLORS: Colors = {
  PRIMARY_BACKGROUND: "#013d5b",
  PRIMARY_GREEN: "#25810E",
  PRIMARY_YELLOW: "#FFDD00",
  WHITE: "#ffffff",
  ERROR_OVERLAY: "rgba(0, 0, 0, 0.9)",
} as const;
