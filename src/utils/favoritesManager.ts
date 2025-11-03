import type { FavoritedOffer } from "../types";
import { getWithTimeout, setWithTimeout, isStorageTimeoutError } from "./storageWithTimeout";
import { FavoritesError, FavoritesErrorCode } from "./favoritesErrors";

const STORAGE_KEY = "c1-offers-favorites";
const MAX_FAVORITES = 1000;
const MAX_STORAGE_SIZE = 1000000;

async function saveFavorites(favorites: FavoritedOffer[]): Promise<void> {
  if (favorites.length > MAX_FAVORITES) {
    throw new FavoritesError(
      `Cannot save more than ${MAX_FAVORITES} favorites`,
      FavoritesErrorCode.SIZE_LIMIT_EXCEEDED,
      { count: favorites.length }
    );
  }

  const serialized = JSON.stringify(favorites);
  if (serialized.length > MAX_STORAGE_SIZE) {
    throw new FavoritesError(
      `Favorites data exceeds storage limit (${MAX_STORAGE_SIZE} bytes)`,
      FavoritesErrorCode.SIZE_LIMIT_EXCEEDED,
      { size: serialized.length }
    );
  }

  try {
    await setWithTimeout({ [STORAGE_KEY]: favorites });
  } catch (error) {
    if (isStorageTimeoutError(error)) {
      throw new FavoritesError(
        'Storage write timed out',
        FavoritesErrorCode.STORAGE_TIMEOUT,
        { originalError: error }
      );
    }
    throw new FavoritesError(
      'Failed to save favorites',
      FavoritesErrorCode.STORAGE_WRITE_FAILED,
      { originalError: error }
    );
  }
}

export async function getFavorites(): Promise<FavoritedOffer[]> {
  try {
    const result = await getWithTimeout(STORAGE_KEY);
    const stored = result[STORAGE_KEY];

    if (!stored) return [];
    if (!Array.isArray(stored)) {
      throw new FavoritesError(
        'Invalid favorites data format',
        FavoritesErrorCode.INVALID_DATA
      );
    }

    return stored;
  } catch (error) {
    if (error instanceof FavoritesError) {
      throw error;
    }
    if (isStorageTimeoutError(error)) {
      throw new FavoritesError(
        'Storage read timed out',
        FavoritesErrorCode.STORAGE_TIMEOUT,
        { originalError: error }
      );
    }
    throw new FavoritesError(
      'Failed to read favorites',
      FavoritesErrorCode.STORAGE_READ_FAILED,
      { originalError: error }
    );
  }
}

export async function isFavorited(merchantTLD: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some(fav => fav.merchantTLD === merchantTLD);
}

/**
 * Adds a favorite offer to storage with retry logic to handle concurrent modifications.
 *
 * Uses optimistic concurrency control: reads current favorites, adds the new one,
 * saves, then verifies the operation succeeded by checking the count increased.
 * Retries up to 3 times with exponential backoff if conflicts are detected.
 *
 * @param offer - The offer to favorite (favoritedAt timestamp added automatically)
 * @throws {FavoritesError} If the offer cannot be added after all retries
 */
export async function addFavorite(offer: Omit<FavoritedOffer, "favoritedAt">): Promise<void> {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const favorites = await getFavorites();
    const originalLength = favorites.length;

    if (favorites.some(fav => fav.merchantTLD === offer.merchantTLD)) {
      return;
    }

    const newFavorite: FavoritedOffer = {
      ...offer,
      favoritedAt: Date.now(),
    };

    const updated = [...favorites, newFavorite];
    await saveFavorites(updated);

    const verify = await getFavorites();
    if (verify.length === originalLength + 1) {
      return;
    }

    if (attempt < MAX_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }

  throw new FavoritesError(
    'Failed to add favorite after retries',
    FavoritesErrorCode.STORAGE_WRITE_FAILED,
    { merchantTLD: offer.merchantTLD }
  );
}

/**
 * Removes a favorite offer from storage with retry logic to handle concurrent modifications.
 *
 * Uses optimistic concurrency control: reads current favorites, filters out the target,
 * saves, then verifies the operation succeeded by checking the count decreased.
 * Retries up to 3 times with exponential backoff if conflicts are detected.
 *
 * @param merchantTLD - The merchant TLD of the offer to remove
 * @throws {FavoritesError} If the offer cannot be removed after all retries
 */
export async function removeFavorite(merchantTLD: string): Promise<void> {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const favorites = await getFavorites();
    const originalLength = favorites.length;
    const filtered = favorites.filter(fav => fav.merchantTLD !== merchantTLD);

    if (filtered.length === originalLength) {
      return;
    }

    await saveFavorites(filtered);

    const verify = await getFavorites();
    if (verify.length === originalLength - 1) {
      return;
    }

    if (attempt < MAX_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }

  throw new FavoritesError(
    'Failed to remove favorite after retries',
    FavoritesErrorCode.STORAGE_WRITE_FAILED,
    { merchantTLD }
  );
}

/**
 * Toggles a favorite offer - adds it if not present, removes it if present.
 *
 * @param offer - The offer to toggle
 * @returns true if the offer was added, false if it was removed
 * @throws {FavoritesError} If the operation fails
 */
export async function toggleFavorite(offer: Omit<FavoritedOffer, "favoritedAt">): Promise<boolean> {
  if (await isFavorited(offer.merchantTLD)) {
    await removeFavorite(offer.merchantTLD);
    return false;
  } else {
    await addFavorite(offer);
    return true;
  }
}

export async function getFavoritesCount(): Promise<number> {
  const favorites = await getFavorites();
  return favorites.length;
}

export async function clearFavorites(): Promise<void> {
  try {
    await chrome.storage.local.remove(STORAGE_KEY);
  } catch (error) {
    throw new FavoritesError(
      'Failed to clear favorites',
      FavoritesErrorCode.STORAGE_WRITE_FAILED,
      { originalError: error }
    );
  }
}
