/**
 * Behavior tests for useFavorites hook
 * Tests user-facing behaviors and interactions, not implementation details
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFavorites } from "../useFavorites";
import * as favoritesManager from "@/utils/favoritesManager";
import type { FavoritedOffer } from "@/types";

vi.mock("@/utils/favoritesManager");

describe("useFavorites - User Behaviors", () => {
  const mockFavorites: FavoritedOffer[] = [
    {
      merchantName: "Hilton Hotels",
      merchantTLD: "hilton.com",
      mileageValue: "10X miles",
      favoritedAt: Date.now() - 1000,
    },
    {
      merchantName: "Delta Airlines",
      merchantTLD: "delta.com",
      mileageValue: "5X miles",
      favoritedAt: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(favoritesManager.getFavorites).mockResolvedValue([]);
  });

  describe("User Opens Popup - Initial Load", () => {
    it("should load favorites from storage on mount", async () => {
      vi.mocked(favoritesManager.getFavorites).mockResolvedValue(mockFavorites);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(favoritesManager.getFavorites).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(result.current.favorites).toEqual(mockFavorites);
        expect(result.current.favoritesCount).toBe(2);
      });
    });

    it("should show zero favorites when none exist", async () => {
      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.favorites).toEqual([]);
        expect(result.current.favoritesCount).toBe(0);
      });
    });

    it("should start with favorites filter disabled", () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.showFavoritesOnly).toBe(false);
    });
  });

  describe("User Favorites Offers from Page", () => {
    it("should refresh and show updated favorites count", async () => {
      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.favoritesCount).toBe(0);
      });

      vi.mocked(favoritesManager.getFavorites).mockResolvedValue(mockFavorites);

      await act(async () => {
        await result.current.refreshFavorites();
      });

      expect(result.current.favorites).toEqual(mockFavorites);
      expect(result.current.favoritesCount).toBe(2);
    });

    it("should handle adding multiple favorites", async () => {
      const { result } = renderHook(() => useFavorites());

      vi.mocked(favoritesManager.getFavorites).mockResolvedValue([mockFavorites[0]]);
      await act(async () => {
        await result.current.refreshFavorites();
      });
      expect(result.current.favoritesCount).toBe(1);

      vi.mocked(favoritesManager.getFavorites).mockResolvedValue(mockFavorites);
      await act(async () => {
        await result.current.refreshFavorites();
      });
      expect(result.current.favoritesCount).toBe(2);
    });
  });

  describe("User Toggles Show Favorites Filter", () => {
    it("should toggle filter on when user clicks", () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.showFavoritesOnly).toBe(false);

      act(() => {
        result.current.toggleShowFavoritesOnly();
      });

      expect(result.current.showFavoritesOnly).toBe(true);
    });

    it("should toggle filter off when user clicks again", () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.toggleShowFavoritesOnly();
      });

      expect(result.current.showFavoritesOnly).toBe(true);

      act(() => {
        result.current.toggleShowFavoritesOnly();
      });

      expect(result.current.showFavoritesOnly).toBe(false);
    });

    it("should allow direct setting of filter state", () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.setShowFavoritesOnly(true);
      });

      expect(result.current.showFavoritesOnly).toBe(true);

      act(() => {
        result.current.setShowFavoritesOnly(false);
      });

      expect(result.current.showFavoritesOnly).toBe(false);
    });
  });

  describe("User Removes Favorites from List", () => {
    it("should update count after removing a favorite", async () => {
      vi.mocked(favoritesManager.getFavorites).mockResolvedValue(mockFavorites);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.favoritesCount).toBe(2);
      });

      vi.mocked(favoritesManager.getFavorites).mockResolvedValue([mockFavorites[0]]);

      await act(async () => {
        await result.current.refreshFavorites();
      });

      expect(result.current.favoritesCount).toBe(1);
      expect(result.current.favorites).toEqual([mockFavorites[0]]);
    });

    it("should handle removing all favorites", async () => {
      vi.mocked(favoritesManager.getFavorites).mockResolvedValue(mockFavorites);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.favoritesCount).toBe(2);
      });

      vi.mocked(favoritesManager.getFavorites).mockResolvedValue([]);

      await act(async () => {
        await result.current.refreshFavorites();
      });

      expect(result.current.favoritesCount).toBe(0);
      expect(result.current.favorites).toEqual([]);
    });
  });

  describe("User Reopens Popup", () => {
    it("should reload favorites from storage on each mount", async () => {
      vi.mocked(favoritesManager.getFavorites).mockResolvedValue([mockFavorites[0]]);

      const { unmount } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(favoritesManager.getFavorites).toHaveBeenCalledTimes(1);
      });

      unmount();

      vi.mocked(favoritesManager.getFavorites).mockResolvedValue(mockFavorites);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(favoritesManager.getFavorites).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(result.current.favoritesCount).toBe(2);
      });
    });
  });

  describe("Favorites State Persistence", () => {
    it("should maintain filter state during refresh", async () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.setShowFavoritesOnly(true);
      });

      vi.mocked(favoritesManager.getFavorites).mockResolvedValue(mockFavorites);

      await act(async () => {
        await result.current.refreshFavorites();
      });

      expect(result.current.showFavoritesOnly).toBe(true);
    });

    it("should maintain favorites list during filter toggle", async () => {
      vi.mocked(favoritesManager.getFavorites).mockResolvedValue(mockFavorites);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.favorites).toEqual(mockFavorites);
      });

      act(() => {
        result.current.toggleShowFavoritesOnly();
      });

      expect(result.current.favorites).toEqual(mockFavorites);

      act(() => {
        result.current.toggleShowFavoritesOnly();
      });

      expect(result.current.favorites).toEqual(mockFavorites);
    });
  });

  describe("Edge Cases", () => {
    it("should handle refresh with no changes", async () => {
      vi.mocked(favoritesManager.getFavorites).mockResolvedValue(mockFavorites);

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.favoritesCount).toBe(2);
      });

      await act(async () => {
        await result.current.refreshFavorites();
      });

      expect(result.current.favoritesCount).toBe(2);
      expect(result.current.favorites).toEqual(mockFavorites);
    });

    it("should handle multiple rapid refreshes", async () => {
      const { result } = renderHook(() => useFavorites());

      vi.mocked(favoritesManager.getFavorites).mockResolvedValue(mockFavorites);

      await act(async () => {
        await Promise.all([
          result.current.refreshFavorites(),
          result.current.refreshFavorites(),
          result.current.refreshFavorites(),
        ]);
      });

      expect(result.current.favoritesCount).toBe(2);
    });
  });
});
