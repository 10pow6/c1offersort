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

export interface LoadAllRequestMessage {
  type: "LOAD_ALL_REQUEST";
}

export interface InjectFavoritesRequestMessage {
  type: "INJECT_FAVORITES_REQUEST";
}

export interface RemoveFavoritesRequestMessage {
  type: "REMOVE_FAVORITES_REQUEST";
}

export type ExtensionMessage =
  | PaginationProgressMessage
  | SortingStartMessage
  | SortRequestMessage
  | FilterRequestMessage
  | LoadAllRequestMessage
  | InjectFavoritesRequestMessage
  | RemoveFavoritesRequestMessage;

/**
 * Type guard to check if a message is an ExtensionMessage
 */
export function isExtensionMessage(message: unknown): message is ExtensionMessage {
  if (!message || typeof message !== "object") {
    return false;
  }

  const msg = message as Record<string, unknown>;

  return (
    msg.type === "PAGINATION_PROGRESS" ||
    msg.type === "SORTING_START" ||
    msg.type === "SORT_REQUEST" ||
    msg.type === "FILTER_REQUEST" ||
    msg.type === "LOAD_ALL_REQUEST" ||
    msg.type === "INJECT_FAVORITES_REQUEST" ||
    msg.type === "REMOVE_FAVORITES_REQUEST"
  );
}

/**
 * Type guard for PaginationProgressMessage
 */
export function isPaginationProgressMessage(
  message: unknown
): message is PaginationProgressMessage {
  if (!isExtensionMessage(message)) {
    return false;
  }
  return message.type === "PAGINATION_PROGRESS";
}

/**
 * Type guard for SortingStartMessage
 */
export function isSortingStartMessage(
  message: unknown
): message is SortingStartMessage {
  if (!isExtensionMessage(message)) {
    return false;
  }
  return message.type === "SORTING_START";
}

