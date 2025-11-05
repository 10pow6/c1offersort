/**
 * Central configuration for the C1 Offers Sorter extension.
 * Provides environment-specific settings and constants.
 */

export const config = {
  app: {
    name: "C1 Offers Sorter",
    get version() {
      // Dynamically get version from manifest
      if (typeof chrome !== "undefined" && chrome.runtime?.getManifest) {
        return chrome.runtime.getManifest().version;
      }
      return "2.1.0"; // Fallback for test environment
    },
  },

  urls: {
    valid: [
      "https://capitaloneoffers.com/c1-offers",
      "https://capitaloneoffers.com/feed",
    ] as const,
    patterns: [
      "https://capitaloneoffers.com/c1-offers*",
      "https://capitaloneoffers.com/feed*",
    ] as const,
  },

  storage: {
    keys: {
      favorites: "favorites",
    } as const,
    maxFavorites: 1000,
    maxSize: 1024 * 1024, // 1MB
    timeout: 5000, // 5 seconds
  },

  performance: {
    pagination: {
      // Note: Pagination timing constants (delays, thresholds) are defined in
      // src/injected-scripts/pagination.ts since that script runs in page context
      // and cannot import from this config module.
      progressPollInterval: 250, // ms - how often content script checks pagination progress
    },
    mutation: {
      timeout: 5000, // ms
      debounceDelay: 100, // ms
    },
    scrollDelay: 300, // ms
  },

  selectors: {
    mainContainer: ".grid.gap-4.h-full.w-full",
    carousel: '.app-page[style*="grid-column"]',
    tileWrapper: ".flex.cursor-pointer",
    mileagePrimary: 'div.border-none.bg-none[class*="font-semibold"]',
    mileageSecondary: 'div[style*="color: rgb(37, 129, 14)"]',
    viewMoreButton: 'button[class*="p-6"]',
  } as const,

  ui: {
    statusMessageTimeout: 5000, // ms
    errorMessageTimeout: 8000, // ms
  },

  features: {
    sorting: true,
    favorites: true,
    pagination: true,
    analytics: false, // Future feature
  } as const,

  logging: {
    enabled: import.meta.env.MODE !== "production",
    contexts: {
      content: "[Content Script]",
      popup: "[Popup]",
      background: "[Background]",
      injected: "[Injected Script]",
    },
  },
} as const;

export type Config = typeof config;
