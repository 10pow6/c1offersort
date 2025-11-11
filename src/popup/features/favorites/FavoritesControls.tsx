/**
 * Favorites controls component
 * Encapsulates favorites UI and logic
 */

import React from 'react';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { FavoritesList } from '../../components/FavoritesList';
import ErrorMessage from '../../components/ErrorMessage';
import type { FavoritedOffer } from '@/types';

interface FavoritesControlsProps {
  enabled: boolean;
  isLoading: boolean;
  isDisabled: boolean;
  favorites: FavoritedOffer[];
  favoritesCount: number;
  showFavoritesOnly: boolean;
  missingFavorites: string[];
  listExpanded: boolean;
  showTooltip: boolean;
  errorMessage: string | null;
  onToggleFavorites: () => void;
  onToggleFilter: () => void;
  onToggleList: () => void;
  onTooltipHover: (show: boolean) => void;
  onRefreshFavorites: () => void;
  onClearError: () => void;
}

export const FavoritesControls: React.FC<FavoritesControlsProps> = ({
  enabled,
  isLoading,
  isDisabled,
  favorites,
  favoritesCount,
  showFavoritesOnly,
  missingFavorites,
  listExpanded,
  showTooltip,
  errorMessage,
  onToggleFavorites,
  onToggleFilter,
  onToggleList,
  onTooltipHover,
  onRefreshFavorites,
  onClearError,
}) => {
  return (
    <>
      <div className="feature-toggle">
        <div className="toggle-header">
          <span className="toggle-label">Favorites</span>
          <ToggleSwitch
            checked={enabled}
            onChange={onToggleFavorites}
            disabled={isLoading || isDisabled}
          />
        </div>
        <p className="feature-description">
          Mark offers as favorites with star buttons
        </p>
      </div>

      {enabled && (
        <>
          <div className="feature-toggle favorites-filter-toggle">
            <div className="toggle-header">
              <span className="toggle-label">Show Favorites Only</span>
              <ToggleSwitch
                checked={showFavoritesOnly}
                onChange={onToggleFilter}
                disabled={isLoading || isDisabled}
              />
            </div>
            <p className="feature-description">
              Filter to show only favorited offers
            </p>
          </div>

          {errorMessage && <ErrorMessage message={errorMessage} onDismiss={onClearError} />}

          {favoritesCount > 0 && (
            <div className="favorites-summary">
              <button
                className="favorites-summary-button"
                onClick={onToggleList}
                onMouseEnter={() => onTooltipHover(true)}
                onMouseLeave={() => onTooltipHover(false)}
              >
                <span className="favorites-count">{favoritesCount}</span>
                <span> favorited offer{favoritesCount !== 1 ? "s" : ""}</span>
                <span className="expand-icon">{listExpanded ? "▼" : "▶"}</span>
                {showTooltip && (
                  <span className="favorites-tooltip">
                    Click to {listExpanded ? "hide" : "view"} list
                  </span>
                )}
              </button>

              {missingFavorites.length > 0 && (
                <div className="missing-favorites-warning">
                  ⚠️ {missingFavorites.length} favorite{missingFavorites.length !== 1 ? "s" : ""}{" "}
                  not visible on current page
                </div>
              )}
            </div>
          )}

          {listExpanded && favoritesCount > 0 && (
            <FavoritesList
              favorites={favorites}
              missingFavorites={missingFavorites}
              onRemove={onRefreshFavorites}
              disabled={isLoading}
            />
          )}
        </>
      )}
    </>
  );
};
