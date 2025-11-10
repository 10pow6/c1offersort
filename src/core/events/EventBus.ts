/**
 * Type-safe event bus for decoupling components.
 * Supports async handlers with error isolation.
 */

export type EventHandler<T = any> = (event: T) => void | Promise<void>;

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  /**
   * Subscribe to an event type
   */
  on<T>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Subscribe to an event type (fires once, then unsubscribes)
   */
  once<T>(eventType: string, handler: EventHandler<T>): void {
    const unsubscribe = this.on(eventType, async (event: T) => {
      unsubscribe();
      await handler(event);
    });
  }

  /**
   * Emit an event to all subscribers
   * Errors in handlers are isolated (don't break other handlers)
   */
  async emit<T>(eventType: string, event: T): Promise<void> {
    const handlers = this.handlers.get(eventType);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const promises: Promise<void>[] = [];

    for (const handler of handlers) {
      promises.push(
        Promise.resolve(handler(event)).catch(error => {
          console.error(`[EventBus] Handler error for ${eventType}:`, error);
        })
      );
    }

    await Promise.all(promises);
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Get handler count for event type (useful for debugging)
   */
  listenerCount(eventType: string): number {
    return this.handlers.get(eventType)?.size || 0;
  }
}

// Singleton instance
export const eventBus = new EventBus();
