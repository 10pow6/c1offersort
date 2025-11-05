import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isExtensionContextValid,
  isContextInvalidatedError,
  withContextCheck,
  safeStorageGet,
  safeStorageSet,
} from '../contextCheck';

describe('contextCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isExtensionContextValid', () => {
    it('returns true when chrome.runtime.id exists', () => {
      expect(isExtensionContextValid()).toBe(true);
    });

    it('returns false when chrome.runtime.id is null', () => {
      const originalId = chrome.runtime.id;
      (chrome.runtime as any).id = null;

      expect(isExtensionContextValid()).toBe(false);

      (chrome.runtime as any).id = originalId;
    });
  });

  describe('isContextInvalidatedError', () => {
    it('detects "Extension context invalidated" message', () => {
      const error = new Error('Extension context invalidated');
      expect(isContextInvalidatedError(error)).toBe(true);
    });

    it('detects "Cannot access" message', () => {
      const error = new Error('Cannot access chrome.runtime');
      expect(isContextInvalidatedError(error)).toBe(true);
    });

    it('detects "chrome.runtime" message', () => {
      const error = new Error('Error accessing chrome.runtime');
      expect(isContextInvalidatedError(error)).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      const error = new Error('Some other error');
      expect(isContextInvalidatedError(error)).toBe(false);
    });

    it('returns false for non-Error objects', () => {
      expect(isContextInvalidatedError('string error')).toBe(false);
      expect(isContextInvalidatedError(null)).toBe(false);
      expect(isContextInvalidatedError(undefined)).toBe(false);
    });
  });

  describe('withContextCheck', () => {
    it('returns result when context is valid', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await withContextCheck(fn, 'fallback');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
    });

    it('returns fallback when context invalidation error occurs', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Extension context invalidated'));
      const result = await withContextCheck(fn, 'fallback');

      expect(result).toBe('fallback');
      expect(fn).toHaveBeenCalled();
    });

    it('throws non-context errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Other error'));

      await expect(withContextCheck(fn, 'fallback')).rejects.toThrow('Other error');
    });
  });

  describe('safeStorageGet', () => {
    it('retrieves data from storage when context is valid', async () => {
      const mockData = { 'test-key': 'test-value' };
      vi.mocked(chrome.storage.local.get).mockResolvedValue(mockData);

      const result = await safeStorageGet('test-key');

      expect(result).toEqual(mockData);
      expect(chrome.storage.local.get).toHaveBeenCalledWith('test-key');
    });

    it('returns default value when context is invalid', async () => {
      const originalId = chrome.runtime.id;
      (chrome.runtime as any).id = null;

      const defaultValue = { 'test-key': 'default' };
      const result = await safeStorageGet('test-key', defaultValue);

      expect(result).toEqual(defaultValue);

      (chrome.runtime as any).id = originalId;
    });

    it('returns default value on context invalidation error', async () => {
      vi.mocked(chrome.storage.local.get).mockRejectedValue(
        new Error('Extension context invalidated')
      );

      const defaultValue = { 'test-key': 'default' };
      const result = await safeStorageGet('test-key', defaultValue);

      expect(result).toEqual(defaultValue);
    });
  });

  describe('safeStorageSet', () => {
    it('saves data to storage when context is valid', async () => {
      vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined);

      const result = await safeStorageSet({ 'test-key': 'test-value' });

      expect(result).toBe(true);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ 'test-key': 'test-value' });
    });

    it('returns false when context is invalid', async () => {
      const originalId = chrome.runtime.id;
      (chrome.runtime as any).id = null;

      const result = await safeStorageSet({ 'test-key': 'test-value' });

      expect(result).toBe(false);

      (chrome.runtime as any).id = originalId;
    });

    it('returns false on context invalidation error', async () => {
      vi.mocked(chrome.storage.local.set).mockRejectedValue(
        new Error('Extension context invalidated')
      );

      const result = await safeStorageSet({ 'test-key': 'test-value' });

      expect(result).toBe(false);
    });
  });
});
