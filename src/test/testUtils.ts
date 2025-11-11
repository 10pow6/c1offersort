/**
 * Test utilities and helpers for creating mock data
 */

import { vi } from 'vitest';

/**
 * Create a mock HTMLElement representing a tile
 */
export function createMockTile(options: {
  id?: string;
  merchantTLD?: string;
  merchantName?: string;
  mileageText?: string;
  logoSrc?: string;
  linkHref?: string;
  isCarousel?: boolean;
  isSkeleton?: boolean;
} = {}): HTMLElement {
  const tile = document.createElement('div');
  tile.className = 'OfferCard';

  if (options.id) {
    tile.setAttribute('data-testid', options.id);
  }

  if (options.merchantTLD) {
    const encodedData = btoa(JSON.stringify({ merchantTLD: options.merchantTLD }));
    tile.setAttribute('data-testid', `feed-offer-card-${encodedData}`);
  }

  if (options.logoSrc) {
    const img = document.createElement('img');
    img.src = options.logoSrc;
    tile.appendChild(img);
  }

  if (options.linkHref) {
    const link = document.createElement('a');
    link.href = options.linkHref;
    tile.appendChild(link);
  }

  if (options.mileageText) {
    const mileageEl = document.createElement('div');
    mileageEl.className = 'CardReward';
    mileageEl.textContent = options.mileageText;
    tile.appendChild(mileageEl);
  }

  if (options.merchantName) {
    const nameEl = document.createElement('span');
    nameEl.textContent = options.merchantName;
    tile.appendChild(nameEl);
  }

  if (options.isCarousel) {
    tile.classList.add('OfferCarousel_offerCard');
  }

  if (options.isSkeleton) {
    tile.classList.add('Skeleton');
  }

  return tile;
}

/**
 * Create a mock container element
 */
export function createMockContainer(tiles: HTMLElement[] = []): HTMLElement {
  const container = document.createElement('div');
  container.setAttribute('data-testid', 'offer-card-feed-container');
  tiles.forEach(tile => container.appendChild(tile));
  return container;
}

/**
 * Mock requestAnimationFrame for tests
 */
export function mockRequestAnimationFrame() {
  let callbacks: FrameRequestCallback[] = [];
  let frameId = 0;

  const raf = vi.fn((callback: FrameRequestCallback) => {
    callbacks.push(callback);
    return ++frameId;
  });

  const flush = () => {
    const cbs = callbacks;
    callbacks = [];
    cbs.forEach(cb => cb(performance.now()));
  };

  global.requestAnimationFrame = raf as any;

  return { raf, flush };
}

/**
 * Mock chrome.storage with in-memory storage
 */
export function createMockStorage() {
  const storage = new Map<string, any>();
  const listeners = new Set<(changes: any) => void>();

  return {
    storage,
    listeners,
    chrome: {
      storage: {
        local: {
          get: vi.fn((keys: string | string[] | null) => {
            if (keys === null) {
              return Promise.resolve(Object.fromEntries(storage));
            }
            const keyArray = Array.isArray(keys) ? keys : [keys];
            const result: any = {};
            keyArray.forEach(key => {
              if (storage.has(key)) {
                result[key] = storage.get(key);
              }
            });
            return Promise.resolve(result);
          }),
          set: vi.fn((items: Record<string, any>) => {
            Object.entries(items).forEach(([key, value]) => {
              const oldValue = storage.get(key);
              storage.set(key, value);

              // Notify listeners
              const changes = {
                [key]: { oldValue, newValue: value }
              };
              listeners.forEach(listener => listener(changes));
            });
            return Promise.resolve();
          }),
          remove: vi.fn((keys: string | string[]) => {
            const keyArray = Array.isArray(keys) ? keys : [keys];
            keyArray.forEach(key => {
              const oldValue = storage.get(key);
              storage.delete(key);

              // Notify listeners
              const changes = {
                [key]: { oldValue, newValue: undefined }
              };
              listeners.forEach(listener => listener(changes));
            });
            return Promise.resolve();
          }),
          clear: vi.fn(() => {
            storage.clear();
            return Promise.resolve();
          }),
          onChanged: {
            addListener: vi.fn((listener: (changes: any) => void) => {
              listeners.add(listener);
            }),
            removeListener: vi.fn((listener: (changes: any) => void) => {
              listeners.delete(listener);
            }),
          },
        },
      },
    },
  };
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Flush all pending promises
 */
export async function flushPromises(): Promise<void> {
  await new Promise(resolve => setImmediate(resolve));
}
