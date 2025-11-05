/**
 * Behavior tests for useSortOffers hook
 * Tests user-facing behaviors and interactions, not implementation details
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSortOffers } from "../useSortOffers";
import * as chromeApi from "../../services/chromeApi";
import type { SortResult } from "@/types";

vi.mock("../../services/chromeApi");

describe("useSortOffers - User Behaviors", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(chromeApi.getCurrentTab).mockResolvedValue({
      id: 1,
      url: "https://capitaloneoffers.com/feed",
      active: true,
      highlighted: false,
      pinned: false,
      incognito: false,
      selected: false,
      discarded: false,
      autoDiscardable: false,
      groupId: -1,
      index: 0,
      windowId: 1,
    });

    vi.mocked(chromeApi.executeSortInActiveTab).mockResolvedValue({
      success: true,
      tilesProcessed: 25,
      pagesLoaded: 3,
    });
  });

  describe("Initial State", () => {
    it("should start with default configuration (mileage, descending)", () => {
      const { result } = renderHook(() => useSortOffers());

      expect(result.current.sortConfig.criteria).toBe("mileage");
      expect(result.current.sortConfig.order).toBe("desc");
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastResult).toBe(null);
    });
  });

  describe("User Changes Sort Configuration", () => {
    it("should update sort configuration when user changes it", () => {
      const { result } = renderHook(() => useSortOffers());

      act(() => {
        result.current.setSortConfig({ criteria: "alphabetical", order: "asc" });
      });

      expect(result.current.sortConfig.criteria).toBe("alphabetical");
      expect(result.current.sortConfig.order).toBe("asc");
    });

    it("should persist configuration between multiple changes", () => {
      const { result } = renderHook(() => useSortOffers());

      act(() => {
        result.current.setSortConfig({ criteria: "alphabetical", order: "asc" });
      });

      act(() => {
        result.current.setSortConfig({ criteria: "alphabetical", order: "desc" });
      });

      expect(result.current.sortConfig).toEqual({
        criteria: "alphabetical",
        order: "desc",
      });
    });
  });

  describe("User Clicks Sort Button - Success Flow", () => {
    it("should show loading state while sorting", async () => {
      const { result } = renderHook(() => useSortOffers());

      let sortPromise: Promise<void>;
      act(() => {
        sortPromise = result.current.handleSort();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await sortPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("should execute sort with current configuration", async () => {
      const { result } = renderHook(() => useSortOffers());

      act(() => {
        result.current.setSortConfig({ criteria: "alphabetical", order: "asc" });
      });

      await act(async () => {
        await result.current.handleSort();
      });

      expect(chromeApi.executeSortInActiveTab).toHaveBeenCalledWith({
        criteria: "alphabetical",
        order: "asc",
      });
    });

    it("should store successful result after sorting completes", async () => {
      const { result } = renderHook(() => useSortOffers());

      const mockResult: SortResult = {
        success: true,
        tilesProcessed: 25,
        pagesLoaded: 3,
      };

      vi.mocked(chromeApi.executeSortInActiveTab).mockResolvedValue(mockResult);

      await act(async () => {
        await result.current.handleSort();
      });

      expect(result.current.lastResult).toEqual(mockResult);
    });

    it("should clear previous result when starting new sort", async () => {
      const { result } = renderHook(() => useSortOffers());

      await act(async () => {
        await result.current.handleSort();
      });

      expect(result.current.lastResult).not.toBe(null);

      act(() => {
        result.current.handleSort();
      });

      expect(result.current.lastResult).toBe(null);
    });
  });

  describe("User Clicks Sort Button - Invalid URL", () => {
    it("should show error when not on Capital One page", async () => {
      const { result } = renderHook(() => useSortOffers());

      vi.mocked(chromeApi.getCurrentTab).mockResolvedValue({
        id: 1,
        url: "https://google.com",
        active: true,
        highlighted: false,
        pinned: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: false,
        groupId: -1,
        index: 0,
        windowId: 1,
      });

      await act(async () => {
        await result.current.handleSort();
      });

      expect(result.current.lastResult?.success).toBe(false);
      expect(result.current.lastResult?.error).toContain("valid Capital One");
      expect(chromeApi.executeSortInActiveTab).not.toHaveBeenCalled();
    });

    it("should not execute sort script on invalid URL", async () => {
      const { result } = renderHook(() => useSortOffers());

      vi.mocked(chromeApi.getCurrentTab).mockResolvedValue({
        id: 1,
        url: "https://malicious.com",
        active: true,
        highlighted: false,
        pinned: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: false,
        groupId: -1,
        index: 0,
        windowId: 1,
      });

      await act(async () => {
        await result.current.handleSort();
      });

      expect(chromeApi.executeSortInActiveTab).not.toHaveBeenCalled();
    });
  });

  describe("User Clicks Sort Button - Error Handling", () => {
    it("should handle sort failure gracefully", async () => {
      const { result } = renderHook(() => useSortOffers());

      const errorResult: SortResult = {
        success: false,
        tilesProcessed: 0,
        pagesLoaded: 0,
        error: "Failed to find offer tiles",
      };

      vi.mocked(chromeApi.executeSortInActiveTab).mockResolvedValue(errorResult);

      await act(async () => {
        await result.current.handleSort();
      });

      expect(result.current.lastResult).toEqual(errorResult);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle Chrome API errors", async () => {
      const { result } = renderHook(() => useSortOffers());

      vi.mocked(chromeApi.executeSortInActiveTab).mockRejectedValue(
        new Error("Permission denied")
      );

      await act(async () => {
        await result.current.handleSort();
      });

      expect(result.current.lastResult?.success).toBe(false);
      expect(result.current.lastResult?.error).toContain("Permission denied");
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle unknown errors", async () => {
      const { result } = renderHook(() => useSortOffers());

      vi.mocked(chromeApi.executeSortInActiveTab).mockRejectedValue(
        "Unknown error"
      );

      await act(async () => {
        await result.current.handleSort();
      });

      expect(result.current.lastResult?.success).toBe(false);
      expect(result.current.lastResult?.error).toBe("Unknown error");
    });
  });

  describe("User Sees Progress Updates", () => {
    it("should receive pagination progress updates from content script", async () => {
      const { result } = renderHook(() => useSortOffers());

      const mockMessage = {
        type: "PAGINATION_PROGRESS",
        offersLoaded: 50,
        pagesLoaded: 2,
      };

      act(() => {
        (chrome.runtime.onMessage as any).callListeners(mockMessage, {} as chrome.runtime.MessageSender, () => {});
      });

      expect(result.current.progressUpdate).toEqual({
        type: "pagination",
        offersLoaded: 50,
        pagesLoaded: 2,
      });
    });

    it("should receive sorting start updates from content script", async () => {
      const { result } = renderHook(() => useSortOffers());

      const mockMessage = {
        type: "SORTING_START",
        totalOffers: 75,
      };

      act(() => {
        (chrome.runtime.onMessage as any).callListeners(mockMessage, {} as chrome.runtime.MessageSender, () => {});
      });

      expect(result.current.progressUpdate).toEqual({
        type: "sorting",
        totalOffers: 75,
      });
    });

    it("should clear progress when sort starts", async () => {
      const { result } = renderHook(() => useSortOffers());

      const mockMessage = {
        type: "PAGINATION_PROGRESS",
        offersLoaded: 50,
        pagesLoaded: 2,
      };

      act(() => {
        (chrome.runtime.onMessage as any).callListeners(mockMessage, {} as chrome.runtime.MessageSender, () => {});
      });

      expect(result.current.progressUpdate).not.toBe(null);

      act(() => {
        result.current.handleSort();
      });

      expect(result.current.progressUpdate).toBe(null);
    });
  });

  describe("User Repeatedly Clicks Sort", () => {
    it("should handle multiple sequential sorts", async () => {
      const { result } = renderHook(() => useSortOffers());

      await act(async () => {
        await result.current.handleSort();
      });

      expect(result.current.lastResult?.success).toBe(true);

      await act(async () => {
        await result.current.handleSort();
      });

      expect(result.current.lastResult?.success).toBe(true);
      expect(chromeApi.executeSortInActiveTab).toHaveBeenCalledTimes(2);
    });
  });
});
