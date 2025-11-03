/**
 * Custom Window type declarations for injected scripts
 *
 * These properties are added to the window object by our injected scripts
 * when they run in the Capital One page context.
 */

declare global {
  interface Window {
    __c1ProcessedTiles?: Set<string>;
    __c1FavoritesObserver?: MutationObserver;

    __c1DomHelpers?: {
      isSkeletonTile: (tile: Element) => boolean;
      isCarouselTile: (tile: Element) => boolean;
      shouldExcludeTile: (tile: Element) => boolean;
      countRealTiles: () => number;
      isValidMerchantTLD: (tld: unknown) => boolean;
      extractMerchantTLDFromDataTestId: (tile: HTMLElement) => string;
      extractMerchantTLD: (tile: HTMLElement) => string;
      domainToDisplayName: (domain: string) => string;
      extractMerchantName: (tile: HTMLElement) => string;
      extractMileageText: (tile: HTMLElement) => string;
      parseMileageValue: (text: string) => number;
      findMainContainer: () => HTMLElement | null;
      findViewMoreButton: () => HTMLButtonElement | null;
    };

    __c1FavoritesHelpers?: {
      sanitizeString: (input: string, maxLength?: number) => string;
      sanitizeMerchantName: (merchantName: string) => string;
      sanitizeMileageValue: (mileageValue: string) => string;
      getFavorites: () => Promise<any[]>;
      saveFavorites: (favorites: any[]) => Promise<void>;
      isFavorited: (merchantTLD: string) => Promise<boolean>;
      toggleFavorite: (merchantTLD: string, merchantName: string, mileageValue: string) => Promise<boolean>;
      createStarButton: (merchantTLD: string, merchantName: string, mileageValue: string, isInitiallyFavorited: boolean) => HTMLButtonElement;
    };

    __c1Sorting?: {
      executeSorting: (sortCriteria: string, sortOrder: string) => Promise<any>;
      loadAllTiles: () => Promise<number>;
    };

    __c1FavoritesInjection?: {
      executeFavoritesInjection: () => Promise<any>;
      injectStarsIntoAllTiles: () => Promise<number>;
    };

    __c1ApplyFavoritesFilter?: {
      applyFavoritesFilter: (showFavoritesOnly: boolean) => Promise<any>;
    };

    __c1LoadAllOffers?: {
      loadAllOffers: () => Promise<any>;
    };

    __c1RemoveFavoritesStars?: {
      removeAllStars: () => any;
    };
  }

  interface HTMLBodyElement {
    __c1FullyPaginated?: boolean;
  }
}

export {};
