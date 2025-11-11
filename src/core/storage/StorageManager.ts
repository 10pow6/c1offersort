/**
 * Type-safe wrapper around chrome.storage.local
 */

export interface StorageData {
  'c1-favorites': Record<string, { merchantName: string; mileageValue: string; addedAt: number }>;
  'c1-favorites-enabled': boolean;
  'c1-favorites-filter-active': boolean;
  'c1-view-mode': 'grid' | 'table';
  'c1-sort-criteria': string;
  'c1-sort-order': string;
}

class StorageManager {
  /**
   * Get value from storage (type-safe)
   */
  async get<K extends keyof StorageData>(
    key: K
  ): Promise<StorageData[K] | undefined> {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key];
    } catch (error) {
      console.error(`[Storage] Error getting ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Get multiple values from storage
   */
  async getMultiple<K extends keyof StorageData>(
    keys: K[]
  ): Promise<Partial<Pick<StorageData, K>>> {
    try {
      const result = await chrome.storage.local.get(keys);
      return result as Partial<Pick<StorageData, K>>;
    } catch (error) {
      console.error(`[Storage] Error getting multiple:`, error);
      return {};
    }
  }

  /**
   * Set value in storage (type-safe)
   */
  async set<K extends keyof StorageData>(
    key: K,
    value: StorageData[K]
  ): Promise<boolean> {
    try {
      await chrome.storage.local.set({ [key]: value });
      return true;
    } catch (error) {
      console.error(`[Storage] Error setting ${key}:`, error);
      return false;
    }
  }

  /**
   * Set multiple values in storage
   */
  async setMultiple(values: Partial<StorageData>): Promise<boolean> {
    try {
      await chrome.storage.local.set(values);
      return true;
    } catch (error) {
      console.error(`[Storage] Error setting multiple:`, error);
      return false;
    }
  }

  /**
   * Remove value from storage
   */
  async remove(key: keyof StorageData): Promise<boolean> {
    try {
      await chrome.storage.local.remove(key);
      return true;
    } catch (error) {
      console.error(`[Storage] Error removing ${key}:`, error);
      return false;
    }
  }

  /**
   * Listen for storage changes
   */
  onChange<K extends keyof StorageData>(
    key: K,
    callback: (newValue: StorageData[K] | undefined, oldValue: StorageData[K] | undefined) => void
  ): () => void {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes[key]) {
        callback(changes[key].newValue, changes[key].oldValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }
}

export const storageManager = new StorageManager();
