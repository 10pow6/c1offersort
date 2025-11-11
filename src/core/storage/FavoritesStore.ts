/**
 * Write-through cache for favorites.
 * Eliminates the need for complex throttling logic.
 */

import { storageManager } from './StorageManager';

export interface FavoriteData {
  merchantName: string;
  mileageValue: string;
  addedAt: number;
}

class FavoritesStore {
  private cache: Map<string, FavoriteData> = new Map();
  private loaded = false;
  private pendingWrites = new Set<string>();
  private writeTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Load favorites from storage into cache
   */
  async load(): Promise<Map<string, FavoriteData>> {
    if (this.loaded) {
      return new Map(this.cache);
    }

    const stored = await storageManager.get('c1-favorites');
    if (stored) {
      this.cache = new Map(Object.entries(stored));
    }

    this.loaded = true;
    return new Map(this.cache);
  }

  /**
   * Get all favorites (from cache)
   */
  getAll(): Map<string, FavoriteData> {
    if (!this.loaded) {
      console.warn('[FavoritesStore] Accessing cache before load');
    }
    return new Map(this.cache);
  }

  /**
   * Get single favorite (from cache)
   */
  get(merchantTLD: string): FavoriteData | undefined {
    return this.cache.get(merchantTLD);
  }

  /**
   * Check if favorite exists (from cache)
   */
  has(merchantTLD: string): boolean {
    return this.cache.has(merchantTLD);
  }

  /**
   * Add/update favorite (write-through)
   */
  async set(merchantTLD: string, data: FavoriteData): Promise<void> {
    // Update cache immediately
    this.cache.set(merchantTLD, data);

    // Schedule write to storage (debounced)
    this.pendingWrites.add(merchantTLD);
    this.scheduleWrite();
  }

  /**
   * Remove favorite (write-through)
   */
  async delete(merchantTLD: string): Promise<void> {
    // Update cache immediately
    this.cache.delete(merchantTLD);

    // Schedule write to storage (debounced)
    this.pendingWrites.add(merchantTLD);
    this.scheduleWrite();
  }

  /**
   * Clear all favorites
   */
  async clear(): Promise<void> {
    this.cache.clear();
    await storageManager.remove('c1-favorites');
    this.pendingWrites.clear();
  }

  /**
   * Schedule a write to storage (debounced)
   */
  private scheduleWrite(): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
    }

    this.writeTimer = setTimeout(() => {
      this.flush().catch(error => {
        console.error('[FavoritesStore] Flush error:', error);
      });
    }, 1000); // Write after 1 second of inactivity
  }

  /**
   * Flush pending writes to storage
   */
  async flush(): Promise<void> {
    if (this.pendingWrites.size === 0) {
      return;
    }

    // Convert cache to plain object for storage
    const data: Record<string, FavoriteData> = {};
    for (const [key, value] of this.cache) {
      data[key] = value;
    }

    await storageManager.set('c1-favorites', data);
    this.pendingWrites.clear();

    console.log(`[FavoritesStore] Flushed ${Object.keys(data).length} favorites to storage`);
  }
}

export const favoritesStore = new FavoritesStore();

// Auto-flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    favoritesStore.flush();
  });
}
