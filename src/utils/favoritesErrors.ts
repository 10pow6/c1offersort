/**
 * Favorites Error Handling
 * Standardized error types for favorites operations
 */

export enum FavoritesErrorCode {
  STORAGE_READ_FAILED = 'STORAGE_READ_FAILED',
  STORAGE_WRITE_FAILED = 'STORAGE_WRITE_FAILED',
  STORAGE_TIMEOUT = 'STORAGE_TIMEOUT',
  SIZE_LIMIT_EXCEEDED = 'SIZE_LIMIT_EXCEEDED',
  INJECTION_FAILED = 'INJECTION_FAILED',
  NO_ACTIVE_TAB = 'NO_ACTIVE_TAB',
  INVALID_DATA = 'INVALID_DATA',
}

export class FavoritesError extends Error {
  constructor(
    message: string,
    public code: FavoritesErrorCode,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'FavoritesError';

    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, FavoritesError);
    }
  }
}

export function isFavoritesError(error: unknown): error is FavoritesError {
  return error instanceof FavoritesError;
}
