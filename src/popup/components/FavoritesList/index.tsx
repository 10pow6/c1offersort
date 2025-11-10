import React, { useCallback } from 'react';
import type { Favorite } from "@/features/favorites/favorites.types";
import { removeFavorite } from "@/features/favorites/FavoritesStore";
import { updateStarButton } from "@/features/favorites/StarButton";
import "./FavoritesList.css";

interface FavoritesListProps {
  favorites: Favorite[];
  missingFavorites: string[];
  onRemove: () => void;
  currentUrl: string | null;
  disabled?: boolean;
}

export const FavoritesList = React.memo(({
  favorites,
  missingFavorites,
  onRemove,
  currentUrl,
  disabled = false,
}: FavoritesListProps) => {
  const handleRemove = useCallback(async (merchantTLD: string) => {
    try {
      await removeFavorite(merchantTLD);

      // Update all star buttons on the page for this merchant
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        try {
          await chrome.tabs.sendMessage(tabs[0].id, {
            type: "UPDATE_STAR_STATE",
            merchantTLD,
            isFavorited: false,
          });
        } catch (error) {
          // Tab might not have content script loaded, ignore
          console.debug("[Favorites] Could not update star on page:", error);
        }
      }

      onRemove();
    } catch (error) {
      console.error("[Favorites] Failed to remove:", error);
    }
  }, [onRemove]);

  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className="favorites-list">
      <div className="favorites-items">
        {favorites.map((favorite) => {
          const isMissing = missingFavorites.includes(favorite.merchantName);

          return (
            <div
              key={favorite.merchantTLD}
              className={`favorite-item ${isMissing ? "missing" : ""}`}
            >
              <div className="favorite-info">
                <div className="favorite-name">{favorite.merchantName}</div>
                <div
                  className={`favorite-mileage ${
                    isMissing ? "missing-text" : ""
                  }`}
                >
                  {isMissing ? "Not found - try search" : favorite.mileageValue}
                </div>
              </div>
              <button
                className="favorite-remove-btn"
                onClick={() => handleRemove(favorite.merchantTLD)}
                disabled={disabled}
                title="Remove from favorites"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these actually changed
  return prevProps.favorites === nextProps.favorites &&
         prevProps.missingFavorites === nextProps.missingFavorites &&
         prevProps.currentUrl === nextProps.currentUrl;
});

FavoritesList.displayName = 'FavoritesList';
