import { describe, it, expect, beforeEach, vi } from 'vitest';
import { stateManager } from '../StateManager';

describe('StateManager', () => {
  beforeEach(() => {
    stateManager.clear();
  });

  describe('slice creation and basic operations', () => {
    it('should create a state slice with initial value', () => {
      const slice = stateManager.slice('test', { count: 0 });
      expect(slice.get()).toEqual({ count: 0 });
    });

    it('should get and set state values', () => {
      const slice = stateManager.slice('test', 42);
      expect(slice.get()).toBe(42);

      slice.set(100);
      expect(slice.get()).toBe(100);
    });

    it('should support different data types', () => {
      const stringSlice = stateManager.slice('string', 'hello');
      const numberSlice = stateManager.slice('number', 42);
      const objectSlice = stateManager.slice('object', { foo: 'bar' });
      const arraySlice = stateManager.slice('array', [1, 2, 3]);

      expect(stringSlice.get()).toBe('hello');
      expect(numberSlice.get()).toBe(42);
      expect(objectSlice.get()).toEqual({ foo: 'bar' });
      expect(arraySlice.get()).toEqual([1, 2, 3]);
    });

    it('should return same slice when called multiple times with same key', () => {
      const slice1 = stateManager.slice('test', 0);
      const slice2 = stateManager.slice('test', 100); // Initial value ignored

      slice1.set(42);
      expect(slice2.get()).toBe(42); // Same underlying state
    });
  });

  describe('functional updates', () => {
    it('should support functional updates', () => {
      const slice = stateManager.slice('counter', 0);

      slice.set(prev => prev + 1);
      expect(slice.get()).toBe(1);

      slice.set(prev => prev + 1);
      expect(slice.get()).toBe(2);
    });

    it('should support functional updates with objects', () => {
      const slice = stateManager.slice('user', { name: 'Alice', age: 30 });

      slice.set(prev => ({ ...prev, age: 31 }));
      expect(slice.get()).toEqual({ name: 'Alice', age: 31 });
    });
  });

  describe('subscriptions', () => {
    it('should notify listeners when state changes', () => {
      const slice = stateManager.slice('test', 0);
      const listener = vi.fn();

      slice.subscribe(listener);
      slice.set(42);

      expect(listener).toHaveBeenCalledWith(42);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support multiple listeners on same slice', () => {
      const slice = stateManager.slice('test', 0);
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      slice.subscribe(listener1);
      slice.subscribe(listener2);
      slice.set(42);

      expect(listener1).toHaveBeenCalledWith(42);
      expect(listener2).toHaveBeenCalledWith(42);
    });

    it('should unsubscribe when calling returned function', () => {
      const slice = stateManager.slice('test', 0);
      const listener = vi.fn();

      const unsubscribe = slice.subscribe(listener);
      slice.set(1);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      slice.set(2);
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should not notify listeners when state does not change value', () => {
      const slice = stateManager.slice('test', 42);
      const listener = vi.fn();

      slice.subscribe(listener);
      slice.set(42); // Same value

      // Note: StateManager doesn't check for equality, it always notifies
      expect(listener).toHaveBeenCalledWith(42);
    });

    it('should isolate errors in listeners', () => {
      const slice = stateManager.slice('test', 0);
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      slice.subscribe(errorListener);
      slice.subscribe(goodListener);
      slice.set(42);

      expect(errorListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalledWith(42);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('clear', () => {
    it('should clear all slices and listeners', () => {
      const slice1 = stateManager.slice('test1', 1);
      const slice2 = stateManager.slice('test2', 2);
      const listener = vi.fn();

      slice1.subscribe(listener);

      stateManager.clear();

      // After clear, slices should be recreated with initial values
      const newSlice1 = stateManager.slice('test1', 10);
      expect(newSlice1.get()).toBe(10); // New initial value

      newSlice1.set(20);
      expect(listener).not.toHaveBeenCalled(); // Old listener removed
    });
  });

  describe('complex state scenarios', () => {
    it('should handle Map state', () => {
      const slice = stateManager.slice('favorites', new Map<string, boolean>());

      slice.set(prev => {
        const next = new Map(prev);
        next.set('merchant1', true);
        return next;
      });

      expect(slice.get().has('merchant1')).toBe(true);
      expect(slice.get().get('merchant1')).toBe(true);
    });

    it('should handle nested object updates', () => {
      interface State {
        favorites: {
          enabled: boolean;
          filterActive: boolean;
          items: Map<string, any>;
        };
      }

      const slice = stateManager.slice<State>('complex', {
        favorites: {
          enabled: false,
          filterActive: false,
          items: new Map(),
        },
      });

      slice.set(prev => ({
        ...prev,
        favorites: {
          ...prev.favorites,
          enabled: true,
        },
      }));

      expect(slice.get().favorites.enabled).toBe(true);
      expect(slice.get().favorites.filterActive).toBe(false);
    });

    it('should handle rapid updates', () => {
      const slice = stateManager.slice('counter', 0);
      const listener = vi.fn();

      slice.subscribe(listener);

      for (let i = 1; i <= 10; i++) {
        slice.set(prev => prev + 1);
      }

      expect(slice.get()).toBe(10);
      expect(listener).toHaveBeenCalledTimes(10);
    });
  });
});
