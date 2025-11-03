import { findViewMoreButton, countRealTiles } from '../../shared/domHelpers';

/**
 * Waits for new content to appear after pagination.
 * Uses MutationObserver to detect when new tiles are added to the DOM.
 *
 * @param attemptNumber - Current attempt number (for exponential backoff)
 * @param timeout - Maximum time to wait in milliseconds
 */
async function waitForNewContent(attemptNumber: number, timeout: number = 8000): Promise<void> {
  return new Promise((resolve) => {
    const initialCount = countRealTiles();
    let resolved = false;
    let newTilesDetected = false;

    const settlingDelay = Math.min(50 * Math.pow(1.75, attemptNumber), 500);

    const observer = new MutationObserver(() => {
      const currentCount = countRealTiles();

      if (currentCount > initialCount && !newTilesDetected) {
        newTilesDetected = true;
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            observer.disconnect();
            resolve();
          }
        }, settlingDelay);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        observer.disconnect();
        resolve();
      }
    }, timeout);
  });
}

/**
 * Loads all offer tiles by repeatedly clicking "View More Offers" until no more offers appear.
 * Sends progress updates to the extension popup during pagination.
 *
 * @param fullyPaginated - Reference to track if pagination is complete
 * @returns Number of pages loaded
 */
export async function loadAllTiles(fullyPaginated: { value: boolean }): Promise<number> {
  let backoffAttempt = 0;
  let totalPages = 0;
  const maxAttempts = 20;

  if (fullyPaginated.value) {
    return 0;
  }

  const initialButton = findViewMoreButton();
  if (!initialButton) {
    fullyPaginated.value = true;
    return 0;
  }

  while (true) {
    const viewMoreButton = findViewMoreButton();

    if (!viewMoreButton) {
      break;
    }

    const beforeCount = countRealTiles();
    viewMoreButton.click();
    await waitForNewContent(backoffAttempt, 8000);
    const afterCount = countRealTiles();

    if (afterCount > beforeCount) {
      backoffAttempt = 0;
    } else {
      backoffAttempt++;
    }

    totalPages++;

    if (afterCount === beforeCount) {
      break;
    }

    try {
      chrome.runtime.sendMessage({
        type: "PAGINATION_PROGRESS",
        offersLoaded: countRealTiles(),
        pagesLoaded: totalPages,
      }).catch(() => {});
    } catch (error) {
      if (error instanceof Error && error.message.includes('Extension context invalidated')) {
        return totalPages;
      }
    }

    if (totalPages >= maxAttempts) break;
  }

  fullyPaginated.value = true;
  return totalPages;
}
