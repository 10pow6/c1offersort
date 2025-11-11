import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { favoritesStore, FavoriteData } from '../FavoritesStore';
import { storageManager } from '../StorageManager';

vi.mock('../StorageManager', () => ({
  storageManager: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('FavoritesStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset the store completely
    (favoritesStore as any).cache = new Map();
    (favoritesStore as any).loaded = false;
    (favoritesStore as any).pendingWrites = new Set();
    if ((favoritesStore as any).writeTimer) {
      clearTimeout((favoritesStore as any).writeTimer);
      (favoritesStore as any).writeTimer = null;
    }

    // Mock storage to return undefined by default
    (storageManager.get as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('load', () => {
    it('should load favorites from storage', async () => {
      const storedData = {
        'merchant1.com': { merchantName: 'Merchant 1', mileageValue: '5X', addedAt: 123 },
        'merchant2.com': { merchantName: 'Merchant 2', mileageValue: '10X', addedAt: 456 },
      };

      (storageManager.get as any).mockResolvedValue(storedData);

      const result = await favoritesStore.load();

      expect(storageManager.get).toHaveBeenCalledWith('c1-favorites');
      expect(result.size).toBe(2);
      expect(result.get('merchant1.com')).toEqual(storedData['merchant1.com']);
      expect(result.get('merchant2.com')).toEqual(storedData['merchant2.com']);
    });

    it('should return empty map if no stored data', async () => {
      (storageManager.get as any).mockResolvedValue(undefined);

      const result = await favoritesStore.load();

      expect(result.size).toBe(0);
    });

    it('should only load once and return cached data on subsequent calls', async () => {
      const storedData = {
        'merchant1.com': { merchantName: 'Merchant 1', mileageValue: '5X', addedAt: 123 },
      };

      (storageManager.get as any).mockResolvedValue(storedData);

      const result1 = await favoritesStore.load();
      const result2 = await favoritesStore.load();

      expect(storageManager.get).toHaveBeenCalledTimes(1);
      expect(result1.size).toBe(1);
      expect(result2.size).toBe(1);
    });
  });

  describe('getAll', () => {
    it('should return all favorites from cache', async () => {
      const storedData = {
        'merchant1.com': { merchantName: 'Merchant 1', mileageValue: '5X', addedAt: 123 },
      };

      (storageManager.get as any).mockResolvedValue(storedData);
      await favoritesStore.load();

      const result = favoritesStore.getAll();

      expect(result.size).toBe(1);
      expect(result.get('merchant1.com')).toEqual(storedData['merchant1.com']);
    });

    it('should return a copy of the cache (not a reference)', async () => {
      const storedData = {
        'merchant1.com': { merchantName: 'Merchant 1', mileageValue: '5X', addedAt: 123 },
      };

      (storageManager.get as any).mockResolvedValue(storedData);
      await favoritesStore.load();

      const result1 = favoritesStore.getAll();
      const result2 = favoritesStore.getAll();

      expect(result1).not.toBe(result2); // Different objects
      expect(result1.get('merchant1.com')).toEqual(result2.get('merchant1.com'));
    });

    it('should warn if accessed before load', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      favoritesStore.getAll();

      expect(consoleWarn).toHaveBeenCalledWith(
        '[FavoritesStore] Accessing cache before load'
      );

      consoleWarn.mockRestore();
    });
  });

  describe('get', () => {
    it('should get single favorite from cache', async () => {
      const storedData = {
        'merchant1.com': { merchantName: 'Merchant 1', mileageValue: '5X', addedAt: 123 },
      };

      (storageManager.get as any).mockResolvedValue(storedData);
      await favoritesStore.load();

      const result = favoritesStore.get('merchant1.com');

      expect(result).toEqual(storedData['merchant1.com']);
    });

    it('should return undefined for non-existent favorite', async () => {
      (storageManager.get as any).mockResolvedValue({});
      await favoritesStore.load();

      const result = favoritesStore.get('nonexistent.com');

      expect(result).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should check if favorite exists', async () => {
      const storedData = {
        'merchant1.com': { merchantName: 'Merchant 1', mileageValue: '5X', addedAt: 123 },
      };

      (storageManager.get as any).mockResolvedValue(storedData);
      await favoritesStore.load();

      expect(favoritesStore.has('merchant1.com')).toBe(true);
      expect(favoritesStore.has('nonexistent.com')).toBe(false);
    });
  });

  describe('set', () => {
    it('should add favorite to cache and schedule write', async () => {
      (storageManager.get as any).mockResolvedValue({});
      await favoritesStore.load();

      const favoriteData: FavoriteData = {
        merchantName: 'New Merchant',
        mileageValue: '15X',
        addedAt: Date.now(),
      };

      await favoritesStore.set('newmerchant.com', favoriteData);

      // Should be in cache immediately
      expect(favoritesStore.get('newmerchant.com')).toEqual(favoriteData);

      // Write should be scheduled (not immediate)
      expect(storageManager.set).not.toHaveBeenCalled();
    });

    it('should debounce writes to storage', async () => {
      (storageManager.get as any).mockResolvedValue({});
      await favoritesStore.load();

      const data1: FavoriteData = {
        merchantName: 'Merchant 1',
        mileageValue: '5X',
        addedAt: 123,
      };

      const data2: FavoriteData = {
        merchantName: 'Merchant 2',
        mileageValue: '10X',
        addedAt: 456,
      };

      // Add multiple favorites quickly
      await favoritesStore.set('merchant1.com', data1);
      await favoritesStore.set('merchant2.com', data2);

      // Should not write yet
      expect(storageManager.set).not.toHaveBeenCalled();

      // Fast-forward time to trigger debounced write
      vi.advanceTimersByTime(1000);
      await Promise.resolve(); // Wait for async operations

      // Should write once with both favorites
      expect(storageManager.set).toHaveBeenCalledTimes(1);
      expect(storageManager.set).toHaveBeenCalledWith('c1-favorites', {
        'merchant1.com': data1,
        'merchant2.com': data2,
      });
    });
  });

  describe('delete', () => {
    it('should remove favorite from cache and schedule write', async () => {
      const storedData = {
        'merchant1.com': { merchantName: 'Merchant 1', mileageValue: '5X', addedAt: 123 },
      };

      (storageManager.get as any).mockResolvedValue(storedData);
      await favoritesStore.load();

      await favoritesStore.delete('merchant1.com');

      // Should be removed from cache immediately
      expect(favoritesStore.has('merchant1.com')).toBe(false);

      // Write should be scheduled
      vi.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(storageManager.set).toHaveBeenCalledWith('c1-favorites', {});
    });
  });

  describe('clear', () => {
    it('should clear all favorites and remove from storage', async () => {
      const storedData = {
        'merchant1.com': { merchantName: 'Merchant 1', mileageValue: '5X', addedAt: 123 },
        'merchant2.com': { merchantName: 'Merchant 2', mileageValue: '10X', addedAt: 456 },
      };

      (storageManager.get as any).mockResolvedValue(storedData);
      await favoritesStore.load();

      await favoritesStore.clear();

      expect(favoritesStore.getAll().size).toBe(0);
      expect(storageManager.remove).toHaveBeenCalledWith('c1-favorites');
    });

    it('should clear pending writes', async () => {
      (storageManager.get as any).mockResolvedValue({});
      await favoritesStore.load();

      await favoritesStore.set('merchant1.com', {
        merchantName: 'Test',
        mileageValue: '5X',
        addedAt: 123,
      });

      await favoritesStore.clear();

      // Advance time - should not trigger write
      vi.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(storageManager.set).not.toHaveBeenCalled();
    });
  });

  describe('flush', () => {
    it('should immediately write pending changes to storage', async () => {
      (storageManager.get as any).mockResolvedValue({});
      await favoritesStore.load();

      const favoriteData: FavoriteData = {
        merchantName: 'Test Merchant',
        mileageValue: '5X',
        addedAt: 123,
      };

      await favoritesStore.set('test.com', favoriteData);

      // Don't wait for debounce - flush immediately
      await favoritesStore.flush();

      expect(storageManager.set).toHaveBeenCalledWith('c1-favorites', {
        'test.com': favoriteData,
      });
    });

    it('should do nothing if no pending writes', async () => {
      (storageManager.get as any).mockResolvedValue({});
      await favoritesStore.load();

      await favoritesStore.flush();

      expect(storageManager.set).not.toHaveBeenCalled();
    });

    it('should clear pending writes after flush', async () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      (storageManager.get as any).mockResolvedValue({});
      await favoritesStore.load();

      await favoritesStore.set('test.com', {
        merchantName: 'Test',
        mileageValue: '5X',
        addedAt: 123,
      });

      await favoritesStore.flush();

      // Second flush should do nothing
      vi.clearAllMocks();
      await favoritesStore.flush();

      expect(storageManager.set).not.toHaveBeenCalled();

      consoleLog.mockRestore();
    });

    it('should handle flush errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (storageManager.get as any).mockResolvedValue({});
      (storageManager.set as any).mockRejectedValue(new Error('Storage error'));

      await favoritesStore.load();

      await favoritesStore.set('test.com', {
        merchantName: 'Test',
        mileageValue: '5X',
        addedAt: 123,
      });

      // Trigger flush via debounce
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve(); // Allow error to be caught

      // Should not throw
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('write-through cache behavior', () => {
    it('should update cache immediately but write async', async () => {
      (storageManager.get as any).mockResolvedValue({});
      await favoritesStore.load();

      const start = Date.now();
      await favoritesStore.set('test.com', {
        merchantName: 'Test',
        mileageValue: '5X',
        addedAt: start,
      });

      // Cache should be updated immediately
      expect(favoritesStore.get('test.com')).toBeDefined();
      expect(storageManager.set).not.toHaveBeenCalled();

      // Write happens after debounce
      vi.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(storageManager.set).toHaveBeenCalled();
    });
  });
});
