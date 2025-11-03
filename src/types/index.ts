/**
 * Sort criteria type - what to sort by
 * - "mileage": Sort by mileage value
 * - "alphabetical": Sort by merchant name
 */
export type SortCriteria = "mileage" | "alphabetical";

/**
 * Sort order type - direction of sorting
 * - "desc": Sort from highest to lowest (or Z to A)
 * - "asc": Sort from lowest to highest (or A to Z)
 */
export type SortOrder = "desc" | "asc";

/**
 * Complete sort configuration combining criteria and order
 */
export interface SortConfig {
  criteria: SortCriteria;
  order: SortOrder;
}

/**
 * Represents an offer tile with its associated data for sorting
 */
export interface OfferTile {
  element: HTMLElement;
  mileage: number;
  merchantName: string;
}

/**
 * Represents a favorited offer stored in localStorage
 */
export interface FavoritedOffer {
  /** Merchant domain (e.g., "marriott.com") */
  merchantTLD: string;
  /** Display name of merchant */
  merchantName: string;
  /** Mileage value for quick reference */
  mileageValue: string;
  /** Timestamp when favorited */
  favoritedAt: number;
}

/**
 * Result from favorites operations
 */
export interface FavoritesResult {
  success: boolean;
  favoritesCount?: number;
  error?: string;
  /** Favorites that were not found on the page (when filtering) */
  missingFavorites?: string[];
  /** Number of tiles shown after filtering */
  tilesShown?: number;
  /** Number of tiles hidden after filtering */
  tilesHidden?: number;
}

/**
 * Result object returned from sorting operations
 */
export interface SortResult {
  success: boolean;
  tilesProcessed: number;
  pagesLoaded: number;
  error?: string;
}

/**
 * Options for configuring sort behavior
 */
export interface SortOptions {
  sortConfig: SortConfig;
}

/**
 * Configuration for pagination behavior
 */
export interface PaginationConfig {
  /** Maximum number of pagination attempts */
  MAX_ATTEMPTS: number;
  /** Maximum consecutive failures before stopping */
  MAX_CONSECUTIVE_FAILURES: number;
  /** Timeout for mutation observer in milliseconds */
  MUTATION_TIMEOUT_MS: number;
  /** Delay after scrolling before clicking "View More" button */
  SCROLL_DELAY_MS: number;
  /** Text content of the "View More" button */
  BUTTON_TEXT: string;
}

/**
 * CSS selectors for DOM elements
 */
export interface Selectors {
  /** Selector for the main offers container */
  MAIN_CONTAINER: string;
  /** Selector for the carousel element */
  CAROUSEL: string;
  /** Selector for individual offer tile wrappers */
  TILE_WRAPPER: string;
  /** Primary selector for mileage text */
  MILEAGE_PRIMARY: string;
  /** Secondary fallback selector for mileage text */
  MILEAGE_SECONDARY: string;
}

/**
 * Color constants used throughout the application
 */
export interface Colors {
  PRIMARY_BACKGROUND: string;
  PRIMARY_GREEN: string;
  PRIMARY_YELLOW: string;
  WHITE: string;
  ERROR_OVERLAY: string;
}

/**
 * Complete application constants
 */
export interface AppConstants {
  /** Valid Capital One URLs where the extension operates */
  VALID_URLS: readonly string[];
  /** CSS selectors for DOM elements */
  SELECTORS: Selectors;
  /** Pagination configuration */
  PAGINATION: PaginationConfig;
  /** Color constants */
  COLORS: Colors;
}

/**
 * Chrome tab object with essential properties
 */
export interface ChromeTab {
  /** Tab ID (may be undefined for special tabs) */
  id?: number;
  /** Current URL of the tab */
  url?: string;
  /** Whether this tab is active in its window */
  active: boolean;
  /** Title of the tab */
  title?: string;
}

/**
 * Configuration for Chrome script injection
 */
export interface ChromeScriptInjection<Args extends unknown[] = unknown[]> {
  /** Target specification for script injection */
  target: { tabId: number };
  /** Function to inject and execute */
  func: (...args: Args) => unknown;
  /** Arguments to pass to the injected function */
  args?: Args;
}

/**
 * Result from Chrome script execution
 */
export interface ChromeScriptResult<T> {
  /** The result value from the executed script */
  result: T;
  /** Frame ID where the script was executed */
  frameId?: number;
}

export type { ErrorCode } from "../utils/errors";
export { ErrorCodes, SortingError, isSortingError, toSortingError } from "../utils/errors";
