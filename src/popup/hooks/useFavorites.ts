import { useState, useEffect, useCallback, useRef } from "react";
import { getFavorites } from "../../utils/favoritesManager";
import type { FavoritedOffer } from "../../types";

/**
 * Custom hook for managing favorites state from Chrome Storage.
 * Automatically loads favorites when the component mounts and provides a refresh function.
 * URL-aware: loads favorites specific to the current tab's URL.
 *
 * @param currentUrl - The current tab's URL to determine which favorites to load
 * @returns Favorites data, count, and refresh function
 */
export function useFavorites(currentUrl: string | null) {
  const [favorites, setFavorites] = useState<FavoritedOffer[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const currentUrlRef = useRef(currentUrl);

  useEffect(() => {
    currentUrlRef.current = currentUrl;
  }, [currentUrl]);

  useEffect(() => {
    async function loadFavorites() {
      if (!currentUrl) return;
      const loadedFavorites = await getFavorites(currentUrl);
      setFavorites(loadedFavorites);
      setFavoritesCount(loadedFavorites.length);
    }
    loadFavorites();
  }, [currentUrl]);

  const refreshFavorites = useCallback(async () => {
    if (!currentUrlRef.current) return;
    const loadedFavorites = await getFavorites(currentUrlRef.current);
    setFavorites(loadedFavorites);
    setFavoritesCount(loadedFavorites.length);
  }, []);

  return {
    favorites,
    favoritesCount,
    refreshFavorites,
  };
}
