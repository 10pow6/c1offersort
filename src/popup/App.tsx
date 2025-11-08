import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useCurrentTab } from "./hooks/useCurrentTab";
import { useSortOffers } from "./hooks/useSortOffers";
import { useFavorites } from "./hooks/useFavorites";
import { SortCriteriaSelector } from "./components/SortCriteriaSelector";
import { SortOrderSelector } from "./components/SortOrderSelector";
import { SortButton } from "./components/SortButton";
import { StatusMessage } from "./components/StatusMessage";
import { InvalidPageOverlay } from "./components/InvalidPageOverlay";
import { FavoritesList } from "./components/FavoritesList";
import { BuyMeCoffee } from "./components/BuyMeCoffee";
import { HelpButton } from "./components/HelpButton";
import ErrorMessage from "./components/ErrorMessage";
import { FeatureErrorBoundary } from "./components/FeatureErrorBoundary";
import { isValidCapitalOneUrl } from "@/utils/typeGuards";
import { COLORS } from "@/utils/constants";
import { injectFavoritesInActiveTab } from "./services/favoritesInjection";
import { applyFavoritesFilterInActiveTab } from "./services/applyFavoritesFilter";
import { removeFavoritesStarsInActiveTab } from "./services/removeFavoritesStars";
import type { SortCriteria, SortOrder } from "../types";

/**
 * Main application component for the C1 Offers Sorter extension popup.
 * Provides UI for sorting Capital One offers by mileage or merchant name,
 * and managing favorited offers with filtering capabilities.
 *
 * Features:
 * - Sort offers by mileage value or merchant name (ascending/descending)
 * - Mark offers as favorites with star buttons
 * - Filter to show only favorited offers
 * - View and manage list of favorited offers
 * - Real-time progress updates during sorting and pagination
 */
const App: React.FC = () => {
  console.log('[App] Component mounted');

  const currentUrl = useCurrentTab();
  const {
    isLoading,
    sortConfig,
    setSortConfig,
    handleSort,
    lastResult,
    progressUpdate,
  } = useSortOffers();

  console.log('[App] Render - isLoading:', isLoading, 'progressUpdate:', progressUpdate);
  const { favorites, favoritesCount, refreshFavorites } = useFavorites(currentUrl);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoritesEnabled, setFavoritesEnabled] = useState(false);
  const [missingFavorites, setMissingFavorites] = useState<string[]>([]);
  const [favoritesListExpanded, setFavoritesListExpanded] = useState(false);
  const [loadAllProgress, setLoadAllProgress] = useState<{
    offersLoaded: number;
    pagesLoaded: number;
  } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValidUrl = useMemo(() => isValidCapitalOneUrl(currentUrl), [currentUrl]);

  useEffect(() => {
    async function queryFilterProgress() {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]?.id) return;

        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'GET_FILTER_PROGRESS'
        });

        if (response && response.isActive) {
          setIsFilterLoading(true);
          if (response.progress) {
            setLoadAllProgress(response.progress);
          }
        }
      } catch (error) {
        console.log('[App] No active filter operation or failed to query:', error);
      }
    }
    queryFilterProgress();
  }, []);

  useEffect(() => {
    async function loadEnabledState() {
      try {
        const result = await chrome.storage.local.get("c1-favorites-enabled");
        const isEnabled = result["c1-favorites-enabled"] === true;
        setFavoritesEnabled(isEnabled);

        if (isEnabled && isValidUrl) {
          await injectFavoritesInActiveTab();
        }
      } catch (error) {
        console.error("Failed to load favorites state:", error);
      }
    }
    loadEnabledState();
  }, [isValidUrl]);

  useEffect(() => {
    if (!chrome?.runtime?.onMessage) {
      console.error('[App] chrome.runtime.onMessage not available');
      return;
    }

    const messageListener = (
      message: unknown,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: any) => void
    ) => {
      if (typeof message === "object" && message !== null && "type" in message) {
        const msg = message as { type: string; offersLoaded?: number; pagesLoaded?: number };
        if (msg.type === "PAGINATION_PROGRESS" && typeof msg.offersLoaded === "number" && typeof msg.pagesLoaded === "number") {
          setLoadAllProgress({
            offersLoaded: msg.offersLoaded,
            pagesLoaded: msg.pagesLoaded,
          });
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      try {
        chrome.runtime.onMessage.removeListener(messageListener);
      } catch (error) {
        console.log('[App] Failed to remove message listener (extension context may be invalidated):', error);
      }
    };
  }, []);

  const handleCriteriaChange = useCallback((criteria: SortCriteria) => {
    const order = criteria === "mileage" ? "desc" : "asc";
    setSortConfig({ criteria, order });
  }, [setSortConfig]);

  const handleOrderChange = useCallback((order: SortOrder) => {
    setSortConfig(prev => ({ ...prev, order }));
  }, [setSortConfig]);

  const favoritesEnabledRef = useRef(favoritesEnabled);
  useEffect(() => {
    favoritesEnabledRef.current = favoritesEnabled;
  }, [favoritesEnabled]);

  const handleToggleFavorites = useCallback(async () => {
    setIsFavoritesLoading(true);
    setErrorMessage(null);
    try {
      if (favoritesEnabledRef.current) {
        const result = await removeFavoritesStarsInActiveTab();
        if (result.success) {
          setFavoritesEnabled(false);
          await chrome.storage.local.set({ "c1-favorites-enabled": false });
          setShowFavoritesOnly(false);
        } else {
          setErrorMessage(
            `Failed to disable favorites: ${result.error || "Unknown error"}`
          );
        }
      } else {
        const result = await injectFavoritesInActiveTab();
        if (result.success) {
          setFavoritesEnabled(true);
          await chrome.storage.local.set({ "c1-favorites-enabled": true });
          refreshFavorites();
        } else {
          setErrorMessage(
            `Failed to enable favorites: ${result.error || "Unknown error"}`
          );
        }
      }
    } catch (error) {
      setErrorMessage("Error toggling favorites");
      console.error("Error toggling favorites:", error);
    } finally {
      setIsFavoritesLoading(false);
    }
  }, [refreshFavorites]);

  const showFavoritesOnlyRef = useRef(showFavoritesOnly);
  useEffect(() => {
    showFavoritesOnlyRef.current = showFavoritesOnly;
  }, [showFavoritesOnly]);

  const handleToggleFavoritesFilter = useCallback(async () => {
    const newShowFavoritesOnly = !showFavoritesOnlyRef.current;
    setIsFilterLoading(true);
    setLoadAllProgress(null);
    setErrorMessage(null);
    setShowFavoritesOnly(newShowFavoritesOnly);

    try{
      const result = await applyFavoritesFilterInActiveTab(
        newShowFavoritesOnly
      );

      if (!result.success) {
        setErrorMessage(
          `Failed to apply filter: ${result.error || "Unknown error"}`
        );
        setShowFavoritesOnly(!newShowFavoritesOnly);
        return;
      }

      if (newShowFavoritesOnly && result.missingFavorites) {
        setMissingFavorites(result.missingFavorites);
      } else {
        setMissingFavorites([]);
      }
    } catch (error) {
      console.error("Favorites filter error:", error);
      setErrorMessage("Failed to apply favorites filter");
      setShowFavoritesOnly(!newShowFavoritesOnly);
      setMissingFavorites([]);
    } finally {
      setIsFilterLoading(false);
      setLoadAllProgress(null);
    }
  }, []);

  return (
    <div
      className="App"
      style={{
        backgroundColor: COLORS.PRIMARY_BACKGROUND,
        color: COLORS.WHITE,
        position: "relative",
        maxHeight: favoritesListExpanded ? "600px" : "none",
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
      }}
    >
      <HelpButton />
      <h1
        className="text-xl font-bold"
        style={{ margin: 0, padding: "16px 16px 0 16px", flexShrink: 0 }}
      >
        C1 Offers Sorter
      </h1>

      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: "0 16px",
          minHeight: 0,
        }}
      >
        <FeatureErrorBoundary feature="Sorting">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "16px",
              flexShrink: 0,
            }}
          >
            <SortCriteriaSelector
              sortCriteria={sortConfig.criteria}
              onChange={handleCriteriaChange}
            />
            <SortOrderSelector
              sortOrder={sortConfig.order}
              sortCriteria={sortConfig.criteria}
              onChange={handleOrderChange}
            />
            <SortButton
              onClick={handleSort}
              isLoading={isLoading}
              disabled={!isValidUrl}
            />
            {errorMessage && (
              <ErrorMessage
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
              />
            )}
          </div>
        </FeatureErrorBoundary>

        <FeatureErrorBoundary feature="Favorites">
          <div
            style={{
              marginTop: "12px",
              flex: favoritesListExpanded ? 1 : "0 0 auto",
              overflow: "visible",
              display: "flex",
              flexDirection: "column",
              paddingBottom: "12px",
              minHeight: 0,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "14px",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                flex: favoritesListExpanded ? 1 : "0 0 auto",
                minHeight: 0,
                overflow: "visible",
              }}
            >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: COLORS.WHITE,
                  }}
                >
                  Favorites
                </span>
                {favoritesCount > 0 && (
                  <span
                    style={{
                      backgroundColor: COLORS.PRIMARY_GREEN,
                      color: COLORS.WHITE,
                      padding: "2px 7px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: "600",
                    }}
                  >
                    {favoritesCount}
                  </span>
                )}
                <div style={{ position: "relative", display: "inline-block" }}>
                  <span
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    style={{
                      fontSize: "10px",
                      color: "rgba(255, 255, 255, 0.5)",
                      cursor: "help",
                      fontWeight: "600",
                      width: "14px",
                      height: "14px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ?
                  </span>
                  {showTooltip && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 8px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "rgba(0, 0, 0, 0.95)",
                        color: COLORS.WHITE,
                        padding: "8px 12px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        lineHeight: "1.4",
                        width: "200px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        zIndex: 1000,
                        whiteSpace: "normal",
                      }}
                    >
                      Enable to add star buttons to offers. Click stars to mark
                      favorites, then filter to show only favorited offers.
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 0,
                          height: 0,
                          borderLeft: "6px solid transparent",
                          borderRight: "6px solid transparent",
                          borderTop: "6px solid rgba(0, 0, 0, 0.95)",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <label
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "44px",
                  height: "24px",
                  cursor:
                    !isValidUrl || isFavoritesLoading
                      ? "not-allowed"
                      : "pointer",
                  opacity: !isValidUrl || isFavoritesLoading ? 0.5 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={favoritesEnabled}
                  onChange={handleToggleFavorites}
                  disabled={!isValidUrl || isFavoritesLoading}
                  style={{
                    opacity: 0,
                    width: 0,
                    height: 0,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    cursor:
                      !isValidUrl || isFavoritesLoading
                        ? "not-allowed"
                        : "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: favoritesEnabled
                      ? COLORS.PRIMARY_GREEN
                      : "#444",
                    transition: "all 0.3s ease",
                    borderRadius: "24px",
                    boxShadow: favoritesEnabled
                      ? "0 0 8px rgba(37, 129, 14, 0.4)"
                      : "none",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: "",
                      height: "18px",
                      width: "18px",
                      left: favoritesEnabled ? "23px" : "3px",
                      bottom: "3px",
                      backgroundColor: COLORS.WHITE,
                      transition: "all 0.3s ease",
                      borderRadius: "50%",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  />
                </span>
              </label>
            </div>

            {isFavoritesLoading && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#aaa",
                  fontStyle: "italic",
                  padding: "4px 0",
                  flexShrink: 0,
                }}
              >
                {favoritesEnabled ? "Removing stars..." : "Adding stars..."}
              </div>
            )}

            {favoritesEnabled && favoritesCount > 0 && (
              <button
                onClick={handleToggleFavoritesFilter}
                disabled={!isValidUrl || isFilterLoading}
                style={{
                  width: "100%",
                  backgroundColor: showFavoritesOnly
                    ? COLORS.PRIMARY_GREEN
                    : "rgba(255, 255, 255, 0.08)",
                  color: COLORS.WHITE,
                  border: `1px solid ${
                    showFavoritesOnly
                      ? COLORS.PRIMARY_GREEN
                      : "rgba(255, 255, 255, 0.15)"
                  }`,
                  padding: "10px 14px",
                  fontSize: "13px",
                  fontWeight: "600",
                  borderRadius: "5px",
                  cursor:
                    isValidUrl && !isFilterLoading ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  opacity: isValidUrl && !isFilterLoading ? 1 : 0.5,
                  boxShadow: showFavoritesOnly
                    ? "0 0 8px rgba(37, 129, 14, 0.3)"
                    : "none",
                  flexShrink: 0,
                }}
              >
                {isFilterLoading ? (
                  <span>Loading all offers...</span>
                ) : (
                  <span>
                    {showFavoritesOnly
                      ? "✓ Showing Favorites Only"
                      : "Show Favorites Only"}
                  </span>
                )}
              </button>
            )}

            {favoritesEnabled && favoritesCount > 0 && (
              <>
                <button
                  onClick={() =>
                    setFavoritesListExpanded(!favoritesListExpanded)
                  }
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    color: "#ccc",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0,
                  }}
                >
                  <span>Your Favorites ({favoritesCount})</span>
                  <span
                    style={{
                      transition: "transform 0.3s ease",
                      transform: favoritesListExpanded
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </span>
                </button>

                {favoritesListExpanded && (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      minHeight: 0,
                      overflow: "hidden",
                    }}
                  >
                    <FavoritesList
                      favorites={favorites}
                      missingFavorites={missingFavorites}
                      onRemove={refreshFavorites}
                      currentUrl={currentUrl}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </FeatureErrorBoundary>
      </div>

      <div
        style={{
          padding: "0 16px 8px 16px",
          flexShrink: 0,
          minHeight: "15px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StatusMessage
          result={lastResult}
          progress={progressUpdate}
          isLoading={isLoading}
          loadAllProgress={loadAllProgress}
          isLoadingAll={isFilterLoading}
          showFavoritesOnly={showFavoritesOnly}
        />

        <BuyMeCoffee />
      </div>

      {!isValidUrl && <InvalidPageOverlay />}
    </div>
  );
};

export default App;
