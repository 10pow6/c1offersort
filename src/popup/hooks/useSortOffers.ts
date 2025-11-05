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

  // Query content script for progress on mount
  useEffect(() => {
    async function queryProgress() {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]?.id) return;

        const response = await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'GET_SORT_PROGRESS'
        });

        if (response && response.isActive) {
          setIsLoading(true);
          if (response.progress) {
            setProgressUpdate(response.progress);
          }
        }
      } catch (error) {
        console.log('[useSortOffers] No active sort operation or failed to query:', error);
      }
    }
    queryProgress();
  }, []);

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

      console.log('[useSortOffers] Received pagination progress:', msg.offersLoaded, 'offers,', msg.pagesLoaded, 'pages');
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

      console.log('[useSortOffers] Received sorting start:', msg.totalOffers, 'offers');
      setProgressUpdate({
        type: "sorting",
        totalOffers: msg.totalOffers,
      });
    } else if (msg.type === "SORT_COMPLETE") {
      console.log('[useSortOffers] Received sort completion:', 'result' in msg ? msg.result : undefined);
      setIsLoading(false);
      setProgressUpdate(null);
      if ('result' in msg && msg.result && typeof msg.result === 'object' && 'success' in msg.result) {
        setLastResult(msg.result as SortResult);
      }
    }
  }, []);

  useEffect(() => {
    if (!chrome?.runtime?.onMessage) {
      console.error('[useSortOffers] chrome.runtime.onMessage not available');
      return;
    }

    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      if (chrome?.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(messageListener);
      }
    };
  }, [messageListener]);

  const handleSort = useCallback(async () => {
    console.log('[useSortOffers] handleSort called with config:', sortConfig);
    setIsLoading(true);
    setLastResult(null);
    setProgressUpdate(null);

    try {
      const currentTab = await getCurrentTab();
      console.log('[useSortOffers] Current tab:', currentTab?.url);

      if (!isValidCapitalOneUrl(currentTab?.url)) {
        console.log('[useSortOffers] Invalid URL, not sorting');
        const errorResult: SortResult = {
          success: false,
          tilesProcessed: 0,
          pagesLoaded: 0,
          error: "Not on a valid Capital One offers page. Please navigate to capitaloneoffers.com/feed.",
        };
        setLastResult(errorResult);
        return;
      }

      console.log('[useSortOffers] Executing sort in active tab...');
      const result = await executeSortInActiveTab(sortConfig);
      console.log('[useSortOffers] Sort result:', result);
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
