export class SortingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'SortingError';
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, SortingError);
    }
  }

  /**
   * Returns a user-friendly error message based on the error code.
   * Hides technical implementation details while providing actionable guidance.
   */
  getUserMessage(): string {
    switch (this.code) {
      case ErrorCodes.NO_ACTIVE_TAB:
        return 'No active browser tab found. Please ensure you have a Capital One offers page open.';
      case ErrorCodes.INVALID_TAB_ID:
        return 'Unable to access the current tab. Please try closing and reopening the extension.';
      case ErrorCodes.INJECTION_FAILED:
        return 'Failed to run sorting script. Please refresh the page and try again.';
      case ErrorCodes.NO_TILES_FOUND:
        return 'No offer tiles found on the page. Please ensure offers are loaded before sorting.';
      case ErrorCodes.PAGINATION_TIMEOUT:
        return 'Timeout while loading all offers. Some offers may not have been included in the sort.';
      case ErrorCodes.CONTAINER_NOT_FOUND:
        return 'Could not locate offers container on the page. The page structure may have changed.';
      case ErrorCodes.SCRIPT_EXECUTION_FAILED:
        return 'Failed to execute sorting script. Please try refreshing the page.';
      case ErrorCodes.INVALID_SORT_RESULT:
        return 'Received invalid response from sorting script. Please try again.';
      default:
        return 'An unexpected error occurred while sorting offers. Please try again.';
    }
  }

  /**
   * Returns a detailed debug message including error code and context.
   * Used for logging and debugging - includes technical details.
   */
  getDebugMessage(): string {
    const contextStr = Object.keys(this.context).length > 0
      ? JSON.stringify(this.context, null, 2)
      : 'No additional context';
    return `[${this.code}] ${this.message}\nContext: ${contextStr}`;
  }
}

export const ErrorCodes = {
  NO_ACTIVE_TAB: 'NO_ACTIVE_TAB',
  INVALID_TAB_ID: 'INVALID_TAB_ID',
  INJECTION_FAILED: 'INJECTION_FAILED',
  NO_TILES_FOUND: 'NO_TILES_FOUND',
  PAGINATION_TIMEOUT: 'PAGINATION_TIMEOUT',
  CONTAINER_NOT_FOUND: 'CONTAINER_NOT_FOUND',
  SCRIPT_EXECUTION_FAILED: 'SCRIPT_EXECUTION_FAILED',
  INVALID_SORT_RESULT: 'INVALID_SORT_RESULT',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export function isSortingError(error: unknown): error is SortingError {
  return error instanceof SortingError;
}
