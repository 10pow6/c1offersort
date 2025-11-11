import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eventBus } from '../EventBus';
import { flushPromises } from '@/test/testUtils';

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  describe('basic event handling', () => {
    it('should subscribe to events', () => {
      const handler = vi.fn();
      eventBus.on('test-event', handler);

      expect(eventBus.listenerCount('test-event')).toBe(1);
    });

    it('should emit events to handlers', async () => {
      const handler = vi.fn();
      eventBus.on('test-event', handler);

      await eventBus.emit('test-event', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not call handler if event not emitted', async () => {
      const handler = vi.fn();
      eventBus.on('test-event', handler);

      await eventBus.emit('other-event', {});

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle events with no handlers', async () => {
      await expect(eventBus.emit('no-handlers', {})).resolves.toBeUndefined();
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe using returned function', async () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.on('test-event', handler);

      await eventBus.emit('test-event', { count: 1 });
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      await eventBus.emit('test-event', { count: 2 });
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
      expect(eventBus.listenerCount('test-event')).toBe(0);
    });

    it('should handle multiple unsubscribes safely', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.on('test-event', handler);

      unsubscribe();
      unsubscribe(); // Should not throw

      expect(eventBus.listenerCount('test-event')).toBe(0);
    });
  });

  describe('multiple handlers', () => {
    it('should call all handlers for same event', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventBus.on('test-event', handler1);
      eventBus.on('test-event', handler2);
      eventBus.on('test-event', handler3);

      await eventBus.emit('test-event', { data: 'test' });

      expect(handler1).toHaveBeenCalledWith({ data: 'test' });
      expect(handler2).toHaveBeenCalledWith({ data: 'test' });
      expect(handler3).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should handle different events independently', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on('event-1', handler1);
      eventBus.on('event-2', handler2);

      await eventBus.emit('event-1', { id: 1 });

      expect(handler1).toHaveBeenCalledWith({ id: 1 });
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should fire handler once then unsubscribe', async () => {
      const handler = vi.fn();
      eventBus.once('test-event', handler);

      await eventBus.emit('test-event', { count: 1 });
      expect(handler).toHaveBeenCalledTimes(1);

      await eventBus.emit('test-event', { count: 2 });
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should support async handlers in once', async () => {
      const handler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      eventBus.once('test-event', handler);
      await eventBus.emit('test-event', {});

      expect(handler).toHaveBeenCalledTimes(1);
      expect(eventBus.listenerCount('test-event')).toBe(0);
    });
  });

  describe('async handlers', () => {
    it('should support async handlers', async () => {
      const results: number[] = [];
      const handler = vi.fn(async (event: { value: number }) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        results.push(event.value);
      });

      eventBus.on('test-event', handler);
      await eventBus.emit('test-event', { value: 42 });

      expect(handler).toHaveBeenCalled();
      expect(results).toEqual([42]);
    });

    it('should wait for all async handlers to complete', async () => {
      const order: string[] = [];

      const handler1 = async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        order.push('handler1');
      };

      const handler2 = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        order.push('handler2');
      };

      eventBus.on('test-event', handler1);
      eventBus.on('test-event', handler2);

      await eventBus.emit('test-event', {});

      // Both should complete, handler2 faster
      expect(order).toContain('handler1');
      expect(order).toContain('handler2');
    });
  });

  describe('error handling', () => {
    it('should isolate errors in handlers', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const goodHandler = vi.fn();

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      eventBus.on('test-event', errorHandler);
      eventBus.on('test-event', goodHandler);

      await eventBus.emit('test-event', { data: 'test' });

      expect(errorHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalledWith({ data: 'test' });
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('should handle errors in async handlers', async () => {
      const errorHandler = vi.fn(async () => {
        throw new Error('Async error');
      });
      const goodHandler = vi.fn();

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      eventBus.on('test-event', errorHandler);
      eventBus.on('test-event', goodHandler);

      await eventBus.emit('test-event', {});

      expect(errorHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('should not break other handlers if one throws', async () => {
      const handlers = [
        vi.fn(() => { throw new Error('Error 1'); }),
        vi.fn(),
        vi.fn(() => { throw new Error('Error 2'); }),
        vi.fn(),
      ];

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      handlers.forEach(h => eventBus.on('test-event', h));
      await eventBus.emit('test-event', {});

      handlers.forEach(h => expect(h).toHaveBeenCalled());
      expect(consoleError).toHaveBeenCalledTimes(2);

      consoleError.mockRestore();
    });
  });

  describe('clear', () => {
    it('should clear all handlers', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on('event-1', handler1);
      eventBus.on('event-2', handler2);

      expect(eventBus.listenerCount('event-1')).toBe(1);
      expect(eventBus.listenerCount('event-2')).toBe(1);

      eventBus.clear();

      expect(eventBus.listenerCount('event-1')).toBe(0);
      expect(eventBus.listenerCount('event-2')).toBe(0);

      await eventBus.emit('event-1', {});
      await eventBus.emit('event-2', {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('should return correct listener count', () => {
      expect(eventBus.listenerCount('test-event')).toBe(0);

      const unsub1 = eventBus.on('test-event', vi.fn());
      expect(eventBus.listenerCount('test-event')).toBe(1);

      const unsub2 = eventBus.on('test-event', vi.fn());
      expect(eventBus.listenerCount('test-event')).toBe(2);

      unsub1();
      expect(eventBus.listenerCount('test-event')).toBe(1);

      unsub2();
      expect(eventBus.listenerCount('test-event')).toBe(0);
    });

    it('should return 0 for non-existent event', () => {
      expect(eventBus.listenerCount('non-existent')).toBe(0);
    });
  });

  describe('complex scenarios', () => {
    it('should handle rapid sequential emits', async () => {
      const handler = vi.fn();
      eventBus.on('test-event', handler);

      for (let i = 0; i < 10; i++) {
        await eventBus.emit('test-event', { count: i });
      }

      expect(handler).toHaveBeenCalledTimes(10);
    });

    it('should handle handler that unsubscribes itself', async () => {
      let unsubscribe: (() => void) | null = null;
      const handler = vi.fn(() => {
        unsubscribe?.();
      });

      unsubscribe = eventBus.on('test-event', handler);

      await eventBus.emit('test-event', {});
      expect(handler).toHaveBeenCalledTimes(1);

      await eventBus.emit('test-event', {});
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle concurrent emits', async () => {
      const handler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      eventBus.on('test-event', handler);

      await Promise.all([
        eventBus.emit('test-event', { id: 1 }),
        eventBus.emit('test-event', { id: 2 }),
        eventBus.emit('test-event', { id: 3 }),
      ]);

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });
});
