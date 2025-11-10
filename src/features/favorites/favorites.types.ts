/**
 * Type definitions for Favorites feature
 */

export interface Favorite {
  merchantTLD: string;
  merchantName: string;
  mileageValue: string;
  favoritedAt: number;
}

export interface FavoritesFilterResult {
  success: boolean;
  tilesShown: number;
  tilesHidden: number;
  missingFavorites?: string[];
  error?: string;
}

export interface FavoritesInjectResult {
  success: boolean;
  tilesProcessed?: number;
  error?: string;
}

export interface StarButtonConfig {
  merchantTLD: string;
  merchantName: string;
  initiallyFavorited: boolean;
}
