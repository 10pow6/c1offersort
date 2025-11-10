import { stateManager } from './StateManager';
import type { SortCriteria, SortOrder } from '@/types';

export interface SortProgress {
  type: 'pagination' | 'sorting';
  offersLoaded?: number;
  pagesLoaded?: number;
  totalOffers?: number;
}

export interface SortState {
  criteria: SortCriteria;
  order: SortOrder;
  isActive: boolean;
  progress: SortProgress | null;
  lastResult: {
    success: boolean;
    tilesProcessed: number;
    pagesLoaded: number;
    error?: string;
  } | null;
}

const initialState: SortState = {
  criteria: 'mileage',
  order: 'desc',
  isActive: false,
  progress: null,
  lastResult: null,
};

export const sortState = stateManager.slice('sort', initialState);

// Convenience methods
export const setSortConfig = (criteria: SortCriteria, order: SortOrder) => {
  sortState.set(prev => ({ ...prev, criteria, order }));
};

export const setSortActive = (isActive: boolean) => {
  sortState.set(prev => ({ ...prev, isActive }));
};

export const setSortProgress = (progress: SortProgress | null) => {
  sortState.set(prev => ({ ...prev, progress }));
};

export const setSortResult = (result: SortState['lastResult']) => {
  sortState.set(prev => ({ ...prev, lastResult: result, isActive: false, progress: null }));
};
