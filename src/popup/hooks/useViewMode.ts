/**
 * Hook for managing view mode state
 */

import { useState, useEffect, useCallback } from 'react';
import { switchViewMode, getCurrentViewMode } from '../services/viewMode';
import type { ViewMode } from '@/types';

export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isLoading, setIsLoading] = useState(false);

  // Load view mode on mount
  useEffect(() => {
    async function loadViewMode() {
      try {
        const currentMode = await getCurrentViewMode();
        setViewMode(currentMode);
      } catch (error) {
        // Silently fail - default to grid
      }
    }
    loadViewMode();
  }, []);

  const toggleViewMode = useCallback(async () => {
    const newMode: ViewMode = viewMode === "grid" ? "table" : "grid";
    setIsLoading(true);

    try {
      await switchViewMode(newMode);
      setViewMode(newMode);
    } catch (error) {
      console.error('Failed to switch view mode:', error);
    } finally {
      setIsLoading(false);
    }
  }, [viewMode]);

  return {
    viewMode,
    isLoading,
    toggleViewMode,
  };
}
