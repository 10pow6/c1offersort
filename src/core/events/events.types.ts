/**
 * All application events with their payloads.
 */

import type { SortCriteria, SortOrder, ViewMode } from '@/types';

export type AppEvent =
  // Sorting events
  | { type: 'SORT_STARTED'; criteria: SortCriteria; order: SortOrder }
  | { type: 'SORT_PROGRESS'; offersLoaded: number; pagesLoaded: number }
  | { type: 'SORT_COMPLETED'; tilesProcessed: number; pagesLoaded: number }
  | { type: 'SORT_FAILED'; error: string }

  // View mode events
  | { type: 'VIEW_MODE_CHANGING'; fromMode: ViewMode; toMode: ViewMode }
  | { type: 'VIEW_MODE_CHANGED'; mode: ViewMode }
  | { type: 'VIEW_MODE_CHANGE_FAILED'; error: string }

  // Favorites events
  | { type: 'FAVORITES_ENABLED' }
  | { type: 'FAVORITES_DISABLED' }
  | { type: 'FAVORITE_ADDED'; merchantTLD: string; merchantName: string }
  | { type: 'FAVORITE_REMOVED'; merchantTLD: string }
  | { type: 'FAVORITES_FILTER_ENABLED' }
  | { type: 'FAVORITES_FILTER_DISABLED' }

  // Pagination events
  | { type: 'PAGINATION_STARTED' }
  | { type: 'PAGINATION_PROGRESS'; offersLoaded: number; pagesLoaded: number }
  | { type: 'PAGINATION_COMPLETED'; pagesLoaded: number }

  // Table view events
  | { type: 'TABLE_VIEW_ENABLED'; offersShown: number }
  | { type: 'TABLE_VIEW_DISABLED' }
  | { type: 'TABLE_VIEW_REFRESHED' };

/**
 * Helper to emit events with type safety
 */
export async function emitEvent(event: AppEvent): Promise<void> {
  const { eventBus } = await import('./EventBus');
  return eventBus.emit(event.type, event);
}

/**
 * Helper to subscribe to events with type safety
 */
export async function onEvent<T extends AppEvent['type']>(
  eventType: T,
  handler: (event: Extract<AppEvent, { type: T }>) => void | Promise<void>
): Promise<() => void> {
  const { eventBus } = await import('./EventBus');
  return eventBus.on(eventType, handler);
}
