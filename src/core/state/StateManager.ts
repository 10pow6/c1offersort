/**
 * Centralized state management for the extension.
 * Provides observable state with type-safe subscriptions.
 */

type Listener<T> = (state: T) => void;

interface StateSlice<T> {
  get(): T;
  set(value: T | ((prev: T) => T)): void;
  subscribe(listener: Listener<T>): () => void;
}

class StateManager {
  private slices = new Map<string, any>();
  private listeners = new Map<string, Set<Listener<any>>>();

  /**
   * Create or get a state slice
   */
  slice<T>(key: string, initial: T): StateSlice<T> {
    if (!this.slices.has(key)) {
      this.slices.set(key, initial);
      this.listeners.set(key, new Set());
    }

    return {
      get: () => this.slices.get(key),

      set: (value) => {
        const currentValue = this.slices.get(key);
        const newValue = typeof value === 'function'
          ? (value as (prev: T) => T)(currentValue)
          : value;

        this.slices.set(key, newValue);
        this.notifyListeners(key, newValue);
      },

      subscribe: (listener) => {
        this.listeners.get(key)!.add(listener);
        return () => this.listeners.get(key)!.delete(listener);
      }
    };
  }

  private notifyListeners<T>(key: string, state: T): void {
    this.listeners.get(key)?.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error(`[StateManager] Listener error for ${key}:`, error);
      }
    });
  }

  /**
   * Clear all state (useful for testing)
   */
  clear(): void {
    this.slices.clear();
    this.listeners.clear();
  }
}

// Singleton instance
export const stateManager = new StateManager();
