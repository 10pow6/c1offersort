import { useState, useCallback, useEffect, useRef } from "react";
import type { SortConfig, SortResult } from "../../types";
import { executeSortInActiveTab, getCurrentTab } from "../services/chromeApi";
import { isValidCapitalOneUrl } from "../../utils/typeGuards";
import { isSortingError } from "../../utils/errors";

interface ProgressUpdate {
  type: "pagination" | "sorting";
  offersLoaded?: number;
  pagesLoaded?: number;
  totalOffers?: number;
}

interface UseSortOffersResult {
  isLoading: boolean;
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;
  handleSort: () => Promise<void>;
  lastResult: SortResult | null;
  progressUpdate: ProgressUpdate | null;
}

/**
 * Custom hook for managing the sorting state and execution.
 *
 * Handles:
 * - Sort configuration (criteria and order)
 * - Loading state during sort operations
 * - Progress updates from the injected sorting script (pagination and sorting phases)
 * - Result tracking with error handling
 * - Message listener for real-time progress updates from content script
 *
 * Progress updates are throttled to max one update per 200ms to avoid excessive re-renders.
 *
 * @returns Sort state and handlers for the UI
 */
export function useSortOffers(): UseSortOffersResult {
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    criteria: "mileage",
    order: "desc",
  });
  const [lastResult, setLastResult] = useState<SortResult | null>(null);
  const [progressUpdate, setProgressUpdate] = useState<ProgressUpdate | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const messageListener = useCallback((
    message: unknown,
    _sender: chrome.runtime.MessageSender,
    _sendResponse: (response?: any) => void
  ) => {
    if (typeof message !== "object" || message === null || !("type" in message)) {
      return;
    }

    const msg = message as {
      type: string;
      offersLoaded?: number;
      pagesLoaded?: number;
      totalOffers?: number;
    };

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

    if (msg.type === "PAGINATION_PROGRESS") {
      if (timeSinceLastUpdate < 200) return;
      if (typeof msg.offersLoaded !== "number" || typeof msg.pagesLoaded !== "number") {
        return;
      }

      lastUpdateTimeRef.current = now;
      setProgressUpdate({
        type: "pagination",
        offersLoaded: msg.offersLoaded,
        pagesLoaded: msg.pagesLoaded,
      });
    } else if (msg.type === "SORTING_START") {
      if (typeof msg.totalOffers !== "number") {
        return;
      }

      setProgressUpdate({
        type: "sorting",
        totalOffers: msg.totalOffers,
      });
    }
  }, []);

  useEffect(() => {
    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, [messageListener]);

  const handleSort = useCallback(async () => {
    setIsLoading(true);
    setLastResult(null);
    setProgressUpdate(null);

    try {
      const currentTab = await getCurrentTab();

      if (!isValidCapitalOneUrl(currentTab?.url)) {
        const errorResult: SortResult = {
          success: false,
          tilesProcessed: 0,
          pagesLoaded: 0,
          error: "Not on a valid Capital One offers page. Please navigate to capitaloneoffers.com/feed or /c1-offers.",
        };
        setLastResult(errorResult);
        return;
      }

      const result = await executeSortInActiveTab(sortConfig);
      setLastResult(result);

      if (!result.success) {
        console.error("Sort failed:", result.error);
      }
    } catch (error) {
      console.error("Error executing script:", error);

      if (isSortingError(error)) {
        console.error("SortingError details:", error.getDebugMessage());
      } else if (error instanceof Error) {
        console.error("Error details:", error.stack);
      }

      setLastResult({
        success: false,
        tilesProcessed: 0,
        pagesLoaded: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
      setProgressUpdate(null);
    }
  }, [sortConfig]);

  return {
    isLoading,
    sortConfig,
    setSortConfig,
    handleSort,
    lastResult,
    progressUpdate,
  };
}
