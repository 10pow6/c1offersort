/**
 * Hook for managing favorites controls state
 */

import { useState, useEffect, useCallback } from 'react';
import { injectFavoritesInActiveTab } from '../services/favoritesInjection';
import { applyFavoritesFilterInActiveTab } from '../services/applyFavoritesFilter';
import { removeFavoritesStarsInActiveTab } from '../services/removeFavoritesStars';

export function useFavoritesControls(isValidUrl: boolean) {
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [missingFavorites, setMissingFavorites] = useState<string[]>([]);
  const [listExpanded, setListExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load enabled state on mount
  useEffect(() => {
    async function loadEnabledState() {
      try {
        const result = await chrome.storage.local.get("c1-favorites-enabled");
        const isEnabled = result["c1-favorites-enabled"] === true;
        setEnabled(isEnabled);

        if (isEnabled && isValidUrl) {
          await injectFavoritesInActiveTab();
        }
      } catch (error) {
        console.error("Failed to load favorites state:", error);
      }
    }
    loadEnabledState();
  }, [isValidUrl]);

  // Load filter state on mount
  useEffect(() => {
    async function loadFilterState() {
      try {
        const result = await chrome.storage.local.get('c1-favorites-filter-active');
        const isFilterActive = result['c1-favorites-filter-active'] === true;
        setShowFavoritesOnly(isFilterActive);
      } catch (error) {
        // Silently fail
      }
    }
    loadFilterState();
  }, []);

  const toggleFavorites = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (enabled) {
        // When disabling favorites, also disable the filter
        if (showFavoritesOnly) {
          await applyFavoritesFilterInActiveTab(false);
        }
        await removeFavoritesStarsInActiveTab();
        // Clear the filter state from storage
        await chrome.storage.local.set({ 'c1-favorites-filter-active': false });
        setEnabled(false);
        setShowFavoritesOnly(false);
        setListExpanded(false);
      } else {
        const result = await injectFavoritesInActiveTab();
        if (result.success) {
          setEnabled(true);
        } else {
          setErrorMessage(result.error || "Failed to enable favorites");
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, showFavoritesOnly]);

  const toggleFilter = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await applyFavoritesFilterInActiveTab(!showFavoritesOnly);

      if (result.success) {
        setShowFavoritesOnly(!showFavoritesOnly);
        setMissingFavorites(result.missingFavorites || []);
      } else {
        setErrorMessage(result.error || "Failed to apply filter");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [showFavoritesOnly]);

  const toggleList = useCallback(() => {
    setListExpanded(!listExpanded);
  }, [listExpanded]);

  const handleTooltipHover = useCallback((show: boolean) => {
    setShowTooltip(show);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    enabled,
    isLoading,
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
  };
}
