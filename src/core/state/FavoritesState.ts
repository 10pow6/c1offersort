import { stateManager } from './StateManager';

export interface FavoriteOffer {
  merchantTLD: string;
  merchantName: string;
  mileageValue: string;
  addedAt: number;
}

export interface FavoritesState {
  enabled: boolean;
  favorites: Map<string, FavoriteOffer>;
  filterActive: boolean;
  isLoading: boolean;
}

const initialState: FavoritesState = {
  enabled: false,
  favorites: new Map(),
  filterActive: false,
  isLoading: false,
};

export const favoritesState = stateManager.slice('favorites', initialState);

// Convenience methods
export const setFavoritesEnabled = (enabled: boolean) => {
  favoritesState.set(prev => ({ ...prev, enabled }));
};

export const setFavoritesList = (favorites: Map<string, FavoriteOffer>) => {
  favoritesState.set(prev => ({ ...prev, favorites }));
};

export const addFavorite = (merchantTLD: string, offer: FavoriteOffer) => {
  favoritesState.set(prev => {
    const newFavorites = new Map(prev.favorites);
    newFavorites.set(merchantTLD, offer);
    return { ...prev, favorites: newFavorites };
  });
};

export const removeFavorite = (merchantTLD: string) => {
  favoritesState.set(prev => {
    const newFavorites = new Map(prev.favorites);
    newFavorites.delete(merchantTLD);
    return { ...prev, favorites: newFavorites };
  });
};

export const setFilterActive = (filterActive: boolean) => {
  favoritesState.set(prev => ({ ...prev, filterActive }));
};

export const setFavoritesLoading = (isLoading: boolean) => {
  favoritesState.set(prev => ({ ...prev, isLoading }));
};
