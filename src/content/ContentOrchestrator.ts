/**
 * Content script orchestrator - coordinates all features
 * Acts as the central coordinator for message handling and feature lifecycle
 */

import { SortOrchestrator } from '@/features/sorting/SortOrchestrator';
import { applyTableView, removeTableView, refreshTableView, isTableViewActive } from '@/features/tableView/TableViewController';
import { setViewMode, getViewMode } from '@/core/state/ViewModeState';
import { emitEvent } from '@/core/events/events.types';
import { eventBus } from '@/core/events/EventBus';

export class ContentOrchestrator {
  private sortOrchestrator = new SortOrchestrator();

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for coordinating features
   */
  private setupEventListeners(): void {
    // When view mode changes, apply or remove table view
    eventBus.on('VIEW_MODE_CHANGED', async (event: any) => {
      if (event.mode === 'table' && !isTableViewActive()) {
        await applyTableView();
      } else if (event.mode === 'grid' && isTableViewActive()) {
        await removeTableView();
      }
    });

    // When favorites toggle, refresh table if active
    eventBus.on('FAVORITES_ENABLED', async () => {
      await refreshTableView();
    });

    eventBus.on('FAVORITES_DISABLED', async () => {
      await refreshTableView();
    });

    // When sort completes, refresh table if in table view
    eventBus.on('SORT_COMPLETED', async () => {
      if (getViewMode() === 'table') {
        await refreshTableView();
      }
    });
  }

  /**
   * Handle sort request
   */
  async handleSort(criteria: string, order: string) {
    return await this.sortOrchestrator.sort(criteria, order);
  }

  /**
   * Handle view mode change request
   */
  async handleViewModeChange(mode: 'grid' | 'table') {
    const currentMode = getViewMode();
    if (currentMode === mode) {
      return { success: true }; // Already in that mode
    }

    try {
      await emitEvent({ type: 'VIEW_MODE_CHANGING', fromMode: currentMode, toMode: mode });
      setViewMode(mode);
      await emitEvent({ type: 'VIEW_MODE_CHANGED', mode });

      // The event listener will handle calling applyTableView() or removeTableView()
      // Wait a bit for the event to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await emitEvent({ type: 'VIEW_MODE_CHANGE_FAILED', error: errorMsg });
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Handle get view mode request
   */
  getViewMode() {
    return { viewMode: getViewMode() };
  }

  /**
   * Handle favorites injection request
   */
  async handleInjectFavorites() {
    try {
      const { enableFavorites } = await import('@/features/favorites/FavoritesOrchestrator');
      const result = await enableFavorites();

      if (result.success) {
        await refreshTableView();
      }

      return result;
    } catch (error) {
      console.error('[ContentOrchestrator] Error injecting favorites:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle favorites removal request
   */
  async handleRemoveFavorites() {
    try {
      const { disableFavorites } = await import('@/features/favorites/FavoritesOrchestrator');
      const result = await disableFavorites();

      if (result.success) {
        await refreshTableView();
      }

      return result;
    } catch (error) {
      console.error('[ContentOrchestrator] Error removing favorites:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle favorites filter request
   */
  async handleFavoritesFilter(showFavoritesOnly: boolean) {
    try {
      const { filterFavorites } = await import('@/features/favorites/FavoritesOrchestrator');
      const result = await filterFavorites(showFavoritesOnly);

      if (result.success) {
        await refreshTableView();
      }

      return result;
    } catch (error) {
      console.error('[ContentOrchestrator] Error applying favorites filter:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
