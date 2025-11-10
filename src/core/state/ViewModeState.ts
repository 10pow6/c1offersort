import { stateManager } from './StateManager';

export type ViewMode = 'grid' | 'table';

export interface ViewModeState {
  mode: ViewMode;
  isTransitioning: boolean;
}

const initialState: ViewModeState = {
  mode: 'grid',
  isTransitioning: false,
};

export const viewModeState = stateManager.slice('viewMode', initialState);

// Convenience methods
export const getViewMode = () => viewModeState.get().mode;
export const setViewMode = (mode: ViewMode) => {
  viewModeState.set(prev => ({ ...prev, mode }));
};
export const setTransitioning = (isTransitioning: boolean) => {
  viewModeState.set(prev => ({ ...prev, isTransitioning }));
};
