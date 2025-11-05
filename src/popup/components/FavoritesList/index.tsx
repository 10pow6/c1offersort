import React from "react";
import type { FavoritedOffer } from "@/types";
import { removeFavorite } from "@/utils/favoritesManager";
import "./FavoritesList.css";

interface FavoritesListProps {
  favorites: FavoritedOffer[];
  missingFavorites: string[];
  onRemove: () => void;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({
  favorites,
  missingFavorites,
  onRemove,
}) => {
  const handleRemove = async (merchantTLD: string) => {
    try {
      await removeFavorite(merchantTLD);
      onRemove();
    } catch (error) {
      console.error("[Favorites] Failed to remove:", error);
    }
  };

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
};
