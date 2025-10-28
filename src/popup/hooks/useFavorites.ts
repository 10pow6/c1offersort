import { useState, useEffect, useCallback } from "react";
import { getFavorites } from "../../utils/favoritesManager";
import type { FavoritedOffer } from "../../types";

/**
 * Custom hook for managing favorites state from Chrome Storage.
 *
 * Automatically loads favorites when the component mounts (e.g., when popup opens),
 * ensuring the UI always reflects the current state. Provides a refresh function
 * to reload favorites after modifications.
 *
 * @returns Favorites data, count, filter state, and control functions
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoritedOffer[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    async function loadFavorites() {
      const loadedFavorites = await getFavorites();
      setFavorites(loadedFavorites);
      setFavoritesCount(loadedFavorites.length);
    }
    loadFavorites();
  }, []);

  const refreshFavorites = useCallback(async () => {
    const loadedFavorites = await getFavorites();
    setFavorites(loadedFavorites);
    setFavoritesCount(loadedFavorites.length);
  }, []);

  const toggleShowFavoritesOnly = useCallback(() => {
    setShowFavoritesOnly(prev => !prev);
  }, []);

  return {
    favorites,
    favoritesCount,
    showFavoritesOnly,
    setShowFavoritesOnly,
    toggleShowFavoritesOnly,
    refreshFavorites,
  };
}
