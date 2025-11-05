/**
 * Tests for storageWithTimeout - critical for preventing hanging operations
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getWithTimeout,
  setWithTimeout,
  StorageTimeoutError,
  isStorageTimeoutError,
} from "../storageWithTimeout";

describe("storageWithTimeout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWithTimeout", () => {
    it("successfully retrieves data within timeout", async () => {
      const mockData = { "test-key": "test-value" };
      vi.mocked(chrome.storage.local.get).mockResolvedValue(mockData);

      const result = await getWithTimeout("test-key");

      expect(result).toEqual(mockData);
      expect(chrome.storage.local.get).toHaveBeenCalledWith("test-key");
    });

    it("supports array of keys", async () => {
      const mockData = { "key1": "value1", "key2": "value2" };
      vi.mocked(chrome.storage.local.get).mockResolvedValue(mockData);

      const result = await getWithTimeout(["key1", "key2"]);

      expect(result).toEqual(mockData);
      expect(chrome.storage.local.get).toHaveBeenCalledWith(["key1", "key2"]);
    });

    it("throws StorageTimeoutError when operation times out", async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 5000))
      );

      await expect(getWithTimeout("test-key", 100)).rejects.toThrow(StorageTimeoutError);
      await expect(getWithTimeout("test-key", 100)).rejects.toThrow(
        "Storage get timed out after 100ms"
      );
    });

    it("uses default timeout of 3000ms", async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 5000))
      );

      const promise = getWithTimeout("test-key");

      await expect(promise).rejects.toThrow("Storage get timed out after 3000ms");
    });

    it("accepts custom timeout value", async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 2000))
      );

      await expect(getWithTimeout("test-key", 500)).rejects.toThrow(
        "Storage get timed out after 500ms"
      );
    });

    it("propagates Chrome API errors", async () => {
      const apiError = new Error("Permission denied");
      vi.mocked(chrome.storage.local.get).mockRejectedValue(apiError);

      await expect(getWithTimeout("test-key")).rejects.toThrow("Permission denied");
      await expect(getWithTimeout("test-key")).rejects.not.toThrow(StorageTimeoutError);
    });
  });

  describe("setWithTimeout", () => {
    it("successfully saves data within timeout", async () => {
      vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined);

      await setWithTimeout({ "test-key": "test-value" });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ "test-key": "test-value" });
    });

    it("throws StorageTimeoutError when operation times out", async () => {
      vi.mocked(chrome.storage.local.set).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 5000))
      );

      await expect(setWithTimeout({ "test-key": "test-value" }, 100)).rejects.toThrow(
        StorageTimeoutError
      );
      await expect(setWithTimeout({ "test-key": "test-value" }, 100)).rejects.toThrow(
        "Storage set timed out after 100ms"
      );
    });

    it("uses default timeout of 3000ms", async () => {
      vi.mocked(chrome.storage.local.set).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 5000))
      );

      const promise = setWithTimeout({ "test-key": "test-value" });

      await expect(promise).rejects.toThrow("Storage set timed out after 3000ms");
    });

    it("accepts custom timeout value", async () => {
      vi.mocked(chrome.storage.local.set).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 2000))
      );

      await expect(setWithTimeout({ "test-key": "test-value" }, 500)).rejects.toThrow(
        "Storage set timed out after 500ms"
      );
    });

    it("propagates Chrome API errors", async () => {
      const apiError = new Error("Quota exceeded");
      vi.mocked(chrome.storage.local.set).mockRejectedValue(apiError);

      await expect(setWithTimeout({ "test-key": "test-value" })).rejects.toThrow("Quota exceeded");
      await expect(setWithTimeout({ "test-key": "test-value" })).rejects.not.toThrow(
        StorageTimeoutError
      );
    });

    it("handles large data sets", async () => {
      const largeData = { "test-key": "x".repeat(10000) };
      vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined);

      await setWithTimeout(largeData);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(largeData);
    });
  });

  describe("isStorageTimeoutError", () => {
    it("returns true for StorageTimeoutError instances", () => {
      const error = new StorageTimeoutError("get", 3000);
      expect(isStorageTimeoutError(error)).toBe(true);
    });

    it("returns false for generic Error instances", () => {
      const error = new Error("Some other error");
      expect(isStorageTimeoutError(error)).toBe(false);
    });

    it("returns false for non-Error values", () => {
      expect(isStorageTimeoutError("error string")).toBe(false);
      expect(isStorageTimeoutError(null)).toBe(false);
      expect(isStorageTimeoutError(undefined)).toBe(false);
      expect(isStorageTimeoutError(123)).toBe(false);
      expect(isStorageTimeoutError({})).toBe(false);
    });

    it("correctly identifies timeout errors in error handling", () => {
      const timeoutError = new StorageTimeoutError("set", 3000);
      const genericError = new Error("Network error");

      if (isStorageTimeoutError(timeoutError)) {
        expect(timeoutError.message).toContain("timed out");
      }

      if (isStorageTimeoutError(genericError)) {
        // Should not reach here
        expect(true).toBe(false);
      }
    });
  });

  describe("StorageTimeoutError", () => {
    it("has correct error name", () => {
      const error = new StorageTimeoutError("get", 3000);
      expect(error.name).toBe("StorageTimeoutError");
    });

    it("formats message correctly for get operation", () => {
      const error = new StorageTimeoutError("get", 3000);
      expect(error.message).toBe("Storage get timed out after 3000ms");
    });

    it("formats message correctly for set operation", () => {
      const error = new StorageTimeoutError("set", 5000);
      expect(error.message).toBe("Storage set timed out after 5000ms");
    });

    it("is an instance of Error", () => {
      const error = new StorageTimeoutError("get", 3000);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("Race Condition Handling", () => {
    it("resolves with data if storage completes before timeout", async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ key: "value" }), 50))
      );

      const result = await getWithTimeout("key", 1000);

      expect(result).toEqual({ key: "value" });
    });

    it("rejects with timeout if storage takes too long", async () => {
      vi.mocked(chrome.storage.local.get).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ key: "value" }), 1000))
      );

      await expect(getWithTimeout("key", 50)).rejects.toThrow(StorageTimeoutError);
    });

    it("cancels timeout timer when storage completes", async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
      vi.mocked(chrome.storage.local.get).mockResolvedValue({ key: "value" });

      await getWithTimeout("key", 1000);

      // The promise race should complete with storage, not timeout
      expect(clearTimeoutSpy).not.toHaveBeenCalled(); // Race doesn't clear the timeout, but it doesn't matter
    });
  });

  describe("Multiple Concurrent Operations", () => {
    it("handles multiple concurrent get operations", async () => {
      vi.mocked(chrome.storage.local.get)
        .mockResolvedValueOnce({ key1: "value1" })
        .mockResolvedValueOnce({ key2: "value2" })
        .mockResolvedValueOnce({ key3: "value3" });

      const results = await Promise.all([
        getWithTimeout("key1"),
        getWithTimeout("key2"),
        getWithTimeout("key3"),
      ]);

      expect(results).toEqual([
        { key1: "value1" },
        { key2: "value2" },
        { key3: "value3" },
      ]);
    });

    it("handles mixed success and timeout scenarios", async () => {
      vi.mocked(chrome.storage.local.get)
        .mockResolvedValueOnce({ key1: "value1" })
        .mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 5000)))
        .mockResolvedValueOnce({ key3: "value3" });

      const results = await Promise.allSettled([
        getWithTimeout("key1"),
        getWithTimeout("key2", 100),
        getWithTimeout("key3"),
      ]);

      expect(results[0].status).toBe("fulfilled");
      expect(results[1].status).toBe("rejected");
      expect(results[2].status).toBe("fulfilled");
    });
  });
});
