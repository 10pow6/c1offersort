/**
 * Chrome storage API wrapper
 * Provides type-safe abstraction over chrome.storage API
 */

export type StorageArea = 'local' | 'sync' | 'session';

/**
 * Get item(s) from storage
 */
export async function get<T = any>(
  keys: string | string[] | null,
  area: StorageArea = 'local'
): Promise<T> {
  try {
    const storage = chrome.storage[area];
    const result = await storage.get(keys);
    return result as T;
  } catch (error) {
    console.error(`[StorageAdapter] Failed to get from ${area}:`, error);
    throw error;
  }
}

/**
 * Set item(s) in storage
 */
export async function set(items: Record<string, any>, area: StorageArea = 'local'): Promise<void> {
  try {
    const storage = chrome.storage[area];
    await storage.set(items);
  } catch (error) {
    console.error(`[StorageAdapter] Failed to set in ${area}:`, error);
    throw error;
  }
}

/**
 * Remove item(s) from storage
 */
export async function remove(keys: string | string[], area: StorageArea = 'local'): Promise<void> {
  try {
    const storage = chrome.storage[area];
    await storage.remove(keys);
  } catch (error) {
    console.error(`[StorageAdapter] Failed to remove from ${area}:`, error);
    throw error;
  }
}

/**
 * Clear all items from storage
 */
export async function clear(area: StorageArea = 'local'): Promise<void> {
  try {
    const storage = chrome.storage[area];
    await storage.clear();
  } catch (error) {
    console.error(`[StorageAdapter] Failed to clear ${area}:`, error);
    throw error;
  }
}

/**
 * Listen for storage changes
 */
export function onChanged(
  callback: (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => void
): () => void {
  chrome.storage.onChanged.addListener(callback);

  return () => {
    chrome.storage.onChanged.removeListener(callback);
  };
}

/**
 * Get bytes in use (only available for sync and local)
 */
export async function getBytesInUse(
  keys?: string | string[],
  area: 'local' | 'sync' = 'local'
): Promise<number> {
  try {
    const storage = chrome.storage[area];
    const bytes = await storage.getBytesInUse(keys);
    return bytes;
  } catch (error) {
    console.error(`[StorageAdapter] Failed to get bytes in use from ${area}:`, error);
    throw error;
  }
}
