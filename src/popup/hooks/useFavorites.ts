import { useState, useEffect, useCallback } from "react";
import { getFavorites } from "@/features/favorites/FavoritesStore";
import type { Favorite } from "@/features/favorites/favorites.types";

/**
 * Custom hook for managing favorites state from Chrome Storage.
 * Automatically loads favorites when the component mounts and provides a refresh function.
 * Uses the new refactored favorites system.
 *
 * @param _currentUrl - Not used in new system (kept for compatibility)
 * @returns Favorites data, count, and refresh function
 */
export function useFavorites(_currentUrl: string | null) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);

  const loadFavorites = useCallback(async () => {
    const loadedFavorites = await getFavorites();
    setFavorites(loadedFavorites);
    setFavoritesCount(loadedFavorites.length);
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const refreshFavorites = useCallback(async () => {
    await loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    favoritesCount,
    refreshFavorites,
  };
}
