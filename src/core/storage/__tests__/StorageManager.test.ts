import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageManager } from '../StorageManager';

describe('StorageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (chrome.storage.local.get as any).mockResolvedValue({});
  });

  describe('get', () => {
    it('should get value from storage', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({
        'c1-favorites-enabled': true
      });

      const result = await storageManager.get('c1-favorites-enabled');
      expect(result).toBe(true);
      expect(chrome.storage.local.get).toHaveBeenCalledWith('c1-favorites-enabled');
    });

    it('should return undefined for missing key', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({});

      const result = await storageManager.get('c1-favorites-enabled');
      expect(result).toBeUndefined();
    });

    it('should handle storage errors', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (chrome.storage.local.get as any).mockRejectedValue(new Error('Storage error'));

      const result = await storageManager.get('c1-favorites-enabled');

      expect(result).toBeUndefined();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('getMultiple', () => {
    it('should get multiple values from storage', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({
        'c1-favorites-enabled': true,
        'c1-view-mode': 'table',
      });

      const result = await storageManager.getMultiple([
        'c1-favorites-enabled',
        'c1-view-mode',
      ]);

      expect(result).toEqual({
        'c1-favorites-enabled': true,
        'c1-view-mode': 'table',
      });
    });

    it('should handle partial results', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({
        'c1-favorites-enabled': true,
        // c1-view-mode not present
      });

      const result = await storageManager.getMultiple([
        'c1-favorites-enabled',
        'c1-view-mode',
      ]);

      expect(result['c1-favorites-enabled']).toBe(true);
      expect(result['c1-view-mode']).toBeUndefined();
    });

    it('should handle storage errors', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (chrome.storage.local.get as any).mockRejectedValue(new Error('Storage error'));

      const result = await storageManager.getMultiple(['c1-favorites-enabled']);

      expect(result).toEqual({});
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('set', () => {
    it('should set value in storage', async () => {
      const result = await storageManager.set('c1-favorites-enabled', true);

      expect(result).toBe(true);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        'c1-favorites-enabled': true
      });
    });

    it('should handle complex data types', async () => {
      const favorites = {
        'merchant1': { merchantName: 'Merchant 1', mileageValue: '5X', addedAt: 123 },
        'merchant2': { merchantName: 'Merchant 2', mileageValue: '10X', addedAt: 456 },
      };

      const result = await storageManager.set('c1-favorites', favorites);

      expect(result).toBe(true);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        'c1-favorites': favorites
      });
    });

    it('should handle storage errors', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (chrome.storage.local.set as any).mockRejectedValue(new Error('Storage error'));

      const result = await storageManager.set('c1-favorites-enabled', true);

      expect(result).toBe(false);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('setMultiple', () => {
    it('should set multiple values in storage', async () => {
      (chrome.storage.local.set as any).mockResolvedValue(undefined);

      const values = {
        'c1-favorites-enabled': true,
        'c1-view-mode': 'table' as const,
      };

      const result = await storageManager.setMultiple(values);

      expect(result).toBe(true);
      expect(chrome.storage.local.set).toHaveBeenCalledWith(values);
    });

    it('should handle storage errors', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (chrome.storage.local.set as any).mockRejectedValue(new Error('Storage error'));

      const result = await storageManager.setMultiple({
        'c1-favorites-enabled': true
      });

      expect(result).toBe(false);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove value from storage', async () => {
      const result = await storageManager.remove('c1-favorites-enabled');

      expect(result).toBe(true);
      expect(chrome.storage.local.remove).toHaveBeenCalledWith('c1-favorites-enabled');
    });

    it('should handle storage errors', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (chrome.storage.local.remove as any).mockRejectedValue(new Error('Storage error'));

      const result = await storageManager.remove('c1-favorites-enabled');

      expect(result).toBe(false);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('onChange', () => {
    let listeners: Set<Function>;

    beforeEach(() => {
      listeners = new Set();
      chrome.storage.onChanged = {
        addListener: vi.fn((listener) => listeners.add(listener)),
        removeListener: vi.fn((listener) => listeners.delete(listener)),
      } as any;
    });

    it('should listen to storage changes', () => {
      const callback = vi.fn();
      storageManager.onChange('c1-favorites-enabled', callback);

      expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();

      // Simulate storage change
      const changes = {
        'c1-favorites-enabled': { newValue: true, oldValue: false }
      };
      listeners.forEach(listener => (listener as any)(changes, 'local'));

      expect(callback).toHaveBeenCalledWith(true, false);
    });

    it('should not trigger for other keys', () => {
      const callback = vi.fn();
      storageManager.onChange('c1-favorites-enabled', callback);

      // Simulate change to different key
      const changes = {
        'c1-view-mode': { newValue: 'table', oldValue: 'grid' }
      };
      listeners.forEach(listener => (listener as any)(changes, 'local'));

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not trigger for non-local storage', () => {
      const callback = vi.fn();
      storageManager.onChange('c1-favorites-enabled', callback);

      const changes = {
        'c1-favorites-enabled': { newValue: true, oldValue: false }
      };
      listeners.forEach(listener => (listener as any)(changes, 'sync'));

      expect(callback).not.toHaveBeenCalled();
    });

    it('should unsubscribe when calling returned function', () => {
      const callback = vi.fn();
      const unsubscribe = storageManager.onChange('c1-favorites-enabled', callback);

      unsubscribe();

      expect(chrome.storage.onChanged.removeListener).toHaveBeenCalled();

      // Verify no longer called
      const changes = {
        'c1-favorites-enabled': { newValue: true, oldValue: false }
      };
      listeners.forEach(listener => (listener as any)(changes, 'local'));

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle undefined values in changes', () => {
      const callback = vi.fn();
      storageManager.onChange('c1-favorites-enabled', callback);

      // Simulate deletion
      const changes = {
        'c1-favorites-enabled': { newValue: undefined, oldValue: true }
      };
      listeners.forEach(listener => (listener as any)(changes, 'local'));

      expect(callback).toHaveBeenCalledWith(undefined, true);
    });
  });
});
