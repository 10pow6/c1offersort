/**
 * Refactored Main application component for the C1 Offers Sorter extension popup.
 * Clean, modular architecture using feature-based components.
 */

import React, { useMemo } from "react";
import { useCurrentTab } from "./hooks/useCurrentTab";
import { useSortOffers } from "./hooks/useSortOffers";
import { useFavorites } from "./hooks/useFavorites";
import { useViewMode } from "./hooks/useViewMode";
import { useFavoritesControls } from "./hooks/useFavoritesControls";
import { SortingControls } from "./features/sorting/SortingControls";
import { ViewModeControls } from "./features/viewMode/ViewModeControls";
import { FavoritesControls } from "./features/favorites/FavoritesControls";
import { InvalidPageOverlay } from "./components/InvalidPageOverlay";
import { BuyMeCoffee } from "./components/BuyMeCoffee";
import { HelpButton } from "./components/HelpButton";
import { FeatureErrorBoundary } from "./components/FeatureErrorBoundary";
import { isValidCapitalOneUrl } from "@/utils/typeGuards";
import "./App.css";
import "./components/SortingSection/SortingSection.css";
import "./components/FeaturesSection/FeaturesSection.css";

/**
 * Main application component
 */
const App: React.FC = () => {
  // Get current tab URL
  const currentUrl = useCurrentTab();
  const isValidUrl = useMemo(() => isValidCapitalOneUrl(currentUrl), [currentUrl]);

  // Sorting state
  const {
    isLoading: isSortLoading,
    sortConfig,
    setSortConfig,
    handleSort,
    lastResult: sortResult,
    progressUpdate: sortProgress,
  } = useSortOffers();

  // View mode state
  const {
    viewMode,
    isLoading: isViewModeLoading,
    toggleViewMode,
  } = useViewMode();

  // Favorites data
  const { favorites, favoritesCount, refreshFavorites } = useFavorites(currentUrl);

  // Favorites controls state
  const {
    enabled: favoritesEnabled,
    isLoading: isFavoritesLoading,
    showFavoritesOnly,
    missingFavorites,
    listExpanded,
    showTooltip,
    errorMessage,
    toggleFavorites,
    toggleFilter,
    toggleList,
    handleTooltipHover,
    clearError,
  } = useFavoritesControls(isValidUrl);

  // Combined loading state
  const isAnyLoading = isSortLoading || isFavoritesLoading || isViewModeLoading;

  return (
    <div className="app-container">
      {!isValidUrl && <InvalidPageOverlay />}

      <header className="app-header">
        <h1 className="app-title">C1 Offers Sorter</h1>
        <div className="header-actions">
          <HelpButton />
        </div>
      </header>

      <div className="app-content-scroll">
        <main className="app-content">
        {/* Sorting Section */}
        <FeatureErrorBoundary feature="Sorting">
          <SortingControls
            criteria={sortConfig.criteria}
            order={sortConfig.order}
            isLoading={isSortLoading}
            isDisabled={!isValidUrl || isAnyLoading}
            lastResult={sortResult}
            progressUpdate={sortProgress}
            onCriteriaChange={(criteria) =>
              setSortConfig({ ...sortConfig, criteria })
            }
            onOrderChange={(order) =>
              setSortConfig({ ...sortConfig, order })
            }
            onSort={handleSort}
          />
        </FeatureErrorBoundary>

        {/* Features Section */}
        <section className="features-section">
          <h2>Features</h2>

          <div className="features-grid">
            {/* View Mode Toggle */}
            <FeatureErrorBoundary feature="Table View">
              <ViewModeControls
                viewMode={viewMode}
                isLoading={isViewModeLoading}
                isDisabled={!isValidUrl || isAnyLoading}
                onToggle={toggleViewMode}
              />
            </FeatureErrorBoundary>

            {/* Favorites Controls */}
            <FeatureErrorBoundary feature="Favorites">
              <FavoritesControls
                enabled={favoritesEnabled}
                isLoading={isFavoritesLoading}
                isDisabled={!isValidUrl || isAnyLoading}
                favorites={favorites}
                favoritesCount={favoritesCount}
                showFavoritesOnly={showFavoritesOnly}
                missingFavorites={missingFavorites}
                listExpanded={listExpanded}
                showTooltip={showTooltip}
                errorMessage={errorMessage}
                onToggleFavorites={toggleFavorites}
                onToggleFilter={toggleFilter}
                onToggleList={toggleList}
                onTooltipHover={handleTooltipHover}
                onRefreshFavorites={refreshFavorites}
                onClearError={clearError}
              />
            </FeatureErrorBoundary>
          </div>
        </section>

        {/* Buy Me Coffee */}
        <BuyMeCoffee />
        </main>
      </div>
    </div>
  );
};

export default App;
