/**
 * Chrome Storage API with Timeout Protection
 * Prevents hanging operations by adding configurable timeouts
 */

export class StorageTimeoutError extends Error {
  constructor(operation: string, timeoutMs: number) {
    super(`Storage ${operation} timed out after ${timeoutMs}ms`);
    this.name = 'StorageTimeoutError';
  }
}

export async function getWithTimeout<T = any>(
  keys: string | string[],
  timeoutMs: number = 3000
): Promise<{ [key: string]: T }> {
  return Promise.race([
    chrome.storage.local.get(keys),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new StorageTimeoutError('get', timeoutMs)), timeoutMs)
    )
  ]);
}

export async function setWithTimeout(
  items: { [key: string]: any },
  timeoutMs: number = 3000
): Promise<void> {
  return Promise.race([
    chrome.storage.local.set(items),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new StorageTimeoutError('set', timeoutMs)), timeoutMs)
    )
  ]);
}

export function isStorageTimeoutError(error: unknown): error is StorageTimeoutError {
  return error instanceof StorageTimeoutError;
}
