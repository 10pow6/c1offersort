/**
 * Favorites storage operations with validation and caching
 * Replaces: src/shared/favoritesHelpers.ts storage logic
 */

import { favoritesStore as coreStore } from '@/core/storage/FavoritesStore';
import type { Favorite } from './favorites.types';

const MAX_FAVORITES = 1000;
const FAVORITES_CACHE_TTL = 10000; // 10 seconds

// Favorites cache
let cachedFavorites: Favorite[] = [];
let favoritesCacheTimestamp = 0;

/**
 * Sanitize string input (security)
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') return "";
  let cleaned = input.replace(/<[^>]*>/g, ''); // Remove HTML
  cleaned = cleaned.replace(/\0/g, ''); // Remove null bytes
  cleaned = cleaned.substring(0, maxLength);
  return cleaned.trim();
}

/**
 * Sanitize merchant name
 */
export function sanitizeMerchantName(merchantName: string): string {
  const sanitized = sanitizeString(merchantName, 200);
  return sanitized.length === 0 ? "Unknown Merchant" : sanitized;
}

/**
 * Sanitize mileage value
 */
export function sanitizeMileageValue(mileageValue: string): string {
  const sanitized = sanitizeString(mileageValue, 100).trim();

  // Accept both miles and cashback formats
  const isValidMiles = /\d+[,\d]*\s*(?:X\s*)?miles/i.test(sanitized);
  const isValidCashback = /(?:up\s+to\s+)?\d+(?:\.\d+)?%\s+back/i.test(sanitized);

  if (!isValidMiles && !isValidCashback && sanitized !== "0 miles") {
    return "0 miles";
  }
  return sanitized;
}

/**
 * Get all favorites with caching
 */
export async function getFavorites(): Promise<Favorite[]> {
  const now = Date.now();
  if (now - favoritesCacheTimestamp < FAVORITES_CACHE_TTL) {
    return cachedFavorites;
  }

  try {
    // Ensure store is loaded first
    await coreStore.load();
    const allFavorites = coreStore.getAll();
    const favorites = Array.from(allFavorites.entries()).map(([merchantTLD, data]) => ({
      merchantTLD,
      merchantName: data.merchantName,
      mileageValue: data.mileageValue,
      favoritedAt: data.addedAt, // Use addedAt from FavoriteData
    }));

    cachedFavorites = favorites;
    favoritesCacheTimestamp = now;
    return favorites;
  } catch (error) {
    console.error('[FavoritesStore] Failed to get favorites:', error);
    return [];
  }
}

/**
 * Check if merchant is favorited
 */
export async function isFavorited(merchantTLD: string): Promise<boolean> {
  try {
    // Ensure store is loaded first
    await coreStore.load();
    return coreStore.has(merchantTLD);
  } catch (error) {
    console.error('[FavoritesStore] Failed to check favorite:', error);
    return false;
  }
}

/**
 * Add or remove favorite
 */
export async function toggleFavorite(
  merchantTLD: string,
  merchantName: string,
  mileageValue: string
): Promise<boolean> {
  try {
    const sanitizedName = sanitizeMerchantName(merchantName);
    const sanitizedMileage = sanitizeMileageValue(mileageValue);

    // Ensure store is loaded first
    await coreStore.load();
    const currentData = coreStore.get(merchantTLD);

    if (currentData) {
      // Remove favorite
      await coreStore.delete(merchantTLD);
      invalidateFavoritesCache();
      return false;
    } else {
      // Add favorite
      const favorites = await getFavorites();
      if (favorites.length >= MAX_FAVORITES) {
        throw new Error(`Favorites limit exceeded (max ${MAX_FAVORITES})`);
      }

      await coreStore.set(merchantTLD, {
        merchantName: sanitizedName,
        mileageValue: sanitizedMileage,
        addedAt: Date.now(),
      });
      invalidateFavoritesCache();
      return true;
    }
  } catch (error) {
    console.error('[FavoritesStore] Failed to toggle favorite:', error);
    throw error;
  }
}

/**
 * Remove a favorite
 */
export async function removeFavorite(merchantTLD: string): Promise<void> {
  try {
    await coreStore.load();
    await coreStore.delete(merchantTLD);
    invalidateFavoritesCache();
  } catch (error) {
    console.error('[FavoritesStore] Failed to remove favorite:', error);
    throw error;
  }
}

/**
 * Invalidate favorites cache
 */
export function invalidateFavoritesCache(): void {
  cachedFavorites = [];
  favoritesCacheTimestamp = 0;
}
