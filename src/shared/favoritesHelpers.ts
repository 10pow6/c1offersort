import { isContextInvalidatedError, safeStorageGet, safeStorageSet } from '../utils/contextCheck';

const STORAGE_KEY = "c1-offers-favorites";
const MAX_FAVORITES = 1000;
const MAX_STORAGE_SIZE = 1000000;

export interface Favorite {
  merchantTLD: string;
  merchantName: string;
  mileageValue: string;
  favoritedAt: number;
}

export function sanitizeString(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') return "";
  let cleaned = input.replace(/<[^>]*>/g, '');
  cleaned = cleaned.replace(/\0/g, '');
  cleaned = cleaned.substring(0, maxLength);
  return cleaned.trim();
}

export function sanitizeMerchantName(merchantName: string): string {
  const sanitized = sanitizeString(merchantName, 200);
  return sanitized.length === 0 ? "Unknown Merchant" : sanitized;
}

export function sanitizeMileageValue(mileageValue: string): string {
  const sanitized = sanitizeString(mileageValue, 100);
  if (!/\d+[,\d]*\s*(?:X\s*)?miles/i.test(sanitized) && sanitized !== "0 miles") {
    return "0 miles";
  }
  return sanitized;
}

export async function getFavorites(): Promise<Favorite[]> {
  try {
    const result = await safeStorageGet(STORAGE_KEY, { [STORAGE_KEY]: [] });
    return result[STORAGE_KEY] || [];
  } catch (error) {
    if (isContextInvalidatedError(error)) {
      console.warn('[Favorites] Extension context invalidated, returning empty favorites');
      return [];
    }
    console.error('[Favorites] Failed to get favorites:', error);
    return [];
  }
}

export async function saveFavorites(favorites: Favorite[]): Promise<void> {
  try {
    if (favorites.length > MAX_FAVORITES) {
      throw new Error(`Favorites limit exceeded (max ${MAX_FAVORITES})`);
    }

    const serialized = JSON.stringify(favorites);
    if (serialized.length > MAX_STORAGE_SIZE) {
      throw new Error('Favorites storage too large');
    }

    const success = await safeStorageSet({ [STORAGE_KEY]: favorites });
    if (!success) {
      console.warn('[Favorites] Save skipped - extension context invalidated');
    }
  } catch (error) {
    if (isContextInvalidatedError(error)) {
      console.warn('[Favorites] Extension context invalidated during save');
      return;
    }
    console.error('[Favorites] Save failed:', error);
    throw error;
  }
}

/**
 * Checks if a merchant is favorited
 */
export async function isFavorited(merchantTLD: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some(fav => fav.merchantTLD === merchantTLD);
}

/**
 * Toggles favorite status for a merchant
 * Uses retry logic with conflict detection to prevent race conditions
 */
export async function toggleFavorite(
  merchantTLD: string,
  merchantName: string,
  mileageValue: string
): Promise<boolean> {
  const sanitizedTLD = merchantTLD;
  const sanitizedName = sanitizeMerchantName(merchantName);
  const sanitizedMileage = sanitizeMileageValue(mileageValue);

  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const favorites = await getFavorites();
    const originalLength = favorites.length;
    const index = favorites.findIndex(fav => fav.merchantTLD === sanitizedTLD);

    let newFavorites: Favorite[];
    let expectedResult: boolean;
    if (index >= 0) {
      newFavorites = [
        ...favorites.slice(0, index),
        ...favorites.slice(index + 1)
      ];
      expectedResult = false;
    } else {
      newFavorites = [
        ...favorites,
        {
          merchantTLD: sanitizedTLD,
          merchantName: sanitizedName,
          mileageValue: sanitizedMileage,
          favoritedAt: Date.now(),
        }
      ];
      expectedResult = true;
    }

    await saveFavorites(newFavorites);

    const verify = await getFavorites();
    const expectedLength = expectedResult ? originalLength + 1 : originalLength - 1;
    if (verify.length === expectedLength) {
      return expectedResult;
    }

    console.warn(`[Favorites] Conflict detected on attempt ${attempt + 1}, retrying...`);
    await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
  }

  throw new Error("Failed to toggle favorite after retries");
}

/**
 * Creates a star button for an offer tile with proper event listener cleanup
 */
export function createStarButton(
  merchantTLD: string,
  merchantName: string,
  mileageValue: string,
  isInitiallyFavorited: boolean
): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "c1-favorite-star";
  button.textContent = isInitiallyFavorited ? "★" : "☆";
  button.setAttribute(
    "aria-label",
    isInitiallyFavorited ? "Unfavorite offer" : "Favorite offer"
  );
  button.setAttribute(
    "title",
    isInitiallyFavorited ? "Remove from favorites" : "Add to favorites"
  );

  button.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #e5e5e5;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    padding: 0;
    transition: all 0.2s ease;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  `;

  const abortController = new AbortController();
  const signal = abortController.signal;

  button.addEventListener("mouseenter", () => {
    button.style.transform = "scale(1.1)";
    button.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
  }, { signal });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "scale(1)";
    button.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
  }, { signal });

  button.addEventListener("click", async (e) => {
    e.stopPropagation();
    e.preventDefault();

    const nowFavorited = await toggleFavorite(merchantTLD, merchantName, mileageValue);
    button.textContent = nowFavorited ? "★" : "☆";
    button.setAttribute(
      "aria-label",
      nowFavorited ? "Unfavorite offer" : "Favorite offer"
    );
    button.setAttribute(
      "title",
      nowFavorited ? "Remove from favorites" : "Add to favorites"
    );
  }, { signal });

  (button as any).__abortController = abortController;

  return button;
}
