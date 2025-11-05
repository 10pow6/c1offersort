/**
 * Message types for communication between extension components.
 * Used for type-safe message passing via chrome.runtime.sendMessage.
 */

export interface PaginationProgressMessage {
  type: "PAGINATION_PROGRESS";
  offersLoaded: number;
  pagesLoaded: number;
}

export interface SortingStartMessage {
  type: "SORTING_START";
  totalOffers: number;
}

export interface SortRequestMessage {
  type: "SORT_REQUEST";
  criteria: string;
  order: string;
}

export interface FilterRequestMessage {
  type: "FILTER_REQUEST";
  showFavoritesOnly: boolean;
}

export interface InjectFavoritesRequestMessage {
  type: "INJECT_FAVORITES_REQUEST";
}

export interface RemoveFavoritesRequestMessage {
  type: "REMOVE_FAVORITES_REQUEST";
}

export interface SortCompleteMessage {
  type: "SORT_COMPLETE";
  result?: {
    success: boolean;
    sortedCount: number;
    errors?: string[];
  };
}

export type ExtensionMessage =
  | PaginationProgressMessage
  | SortingStartMessage
  | SortRequestMessage
  | FilterRequestMessage
  | InjectFavoritesRequestMessage
  | RemoveFavoritesRequestMessage
  | SortCompleteMessage;

