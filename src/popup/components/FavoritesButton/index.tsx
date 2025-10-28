import React from "react";
import "./FavoritesButton.css";

interface FavoritesButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
  favoritesCount: number;
}

export const FavoritesButton: React.FC<FavoritesButtonProps> = ({
  onClick,
  isLoading,
  disabled,
  favoritesCount,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="favorites-button"
      aria-busy={isLoading}
      aria-label={`Enable favorites (${favoritesCount} saved)`}
      title="Add star buttons to offers on the page"
    >
      {isLoading ? (
        <>
          <span className="favorites-button__spinner"></span>
        </>
      ) : (
        <>
          <span className="favorites-button__icon">⭐</span>
          {favoritesCount > 0 && (
            <span className="favorites-button__badge">{favoritesCount}</span>
          )}
        </>
      )}
    </button>
  );
};
