import { findViewMoreButton } from '../../shared/domHelpers';
import { progressState } from '../index';

function parsePaginationResult(element: HTMLElement | null): { pagesLoaded: number } {
  if (!element) {
    console.warn('[Pagination] Result element not found');
    return { pagesLoaded: 0 };
  }

  const pagesLoadedStr = element.getAttribute('data-pages-loaded');
  if (!pagesLoadedStr) {
    console.warn('[Pagination] Missing data-pages-loaded attribute');
    return { pagesLoaded: 0 };
  }

  const pagesLoaded = parseInt(pagesLoadedStr, 10);
  if (isNaN(pagesLoaded) || pagesLoaded < 0) {
    console.warn('[Pagination] Invalid pages loaded value:', pagesLoadedStr);
    return { pagesLoaded: 0 };
  }

  return { pagesLoaded };
}

function parsePaginationProgress(element: HTMLElement | null): { offersLoaded: number; pagesLoaded: number } | null {
  if (!element) {
    return null;
  }

  const offersLoadedStr = element.getAttribute('data-offers-loaded');
  const pagesLoadedStr = element.getAttribute('data-pages-loaded');

  if (!offersLoadedStr || !pagesLoadedStr) {
    return null;
  }

  const offersLoaded = parseInt(offersLoadedStr, 10);
  const pagesLoaded = parseInt(pagesLoadedStr, 10);

  if (isNaN(offersLoaded) || isNaN(pagesLoaded)) {
    console.warn('[Pagination] Invalid progress values:', { offersLoadedStr, pagesLoadedStr });
    return null;
  }

  return { offersLoaded, pagesLoaded };
}

async function executePaginationInPageContext(): Promise<number> {
  console.log('[Pagination] Injecting pagination script into page context...');

  return new Promise((resolve) => {
    let checkResult: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (checkResult !== null) {
        clearInterval(checkResult);
        checkResult = null;
      }
    };

    try {
      const oldResult = document.getElementById('c1-pagination-result');
      const oldProgress = document.getElementById('c1-pagination-progress');
      if (oldResult) oldResult.remove();
      if (oldProgress) oldProgress.remove();

      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('injected-scripts/pagination.js');
      script.onload = () => {
        console.log('[Pagination] Script loaded, waiting for completion...');
        script.remove();

        let attempts = 0;
        const maxWaitAttempts = 720;
        let lastProgressTimestamp = 0;

        checkResult = setInterval(() => {
          console.log('[Pagination] Polling for result... attempt', attempts);

          const progressElement = document.getElementById('c1-pagination-progress');
          if (progressElement) {
            const timestamp = progressElement.getAttribute('data-timestamp');
            if (timestamp && timestamp !== lastProgressTimestamp.toString()) {
              lastProgressTimestamp = parseInt(timestamp);
              const progress = parsePaginationProgress(progressElement);

              if (progress) {
                console.log('[Pagination] Sending progress update:', progress.offersLoaded, 'offers,', progress.pagesLoaded, 'pages');

                if (progressState.sort.isActive) {
                  progressState.sort.progress = {
                    type: 'pagination',
                    offersLoaded: progress.offersLoaded,
                    pagesLoaded: progress.pagesLoaded,
                  };
                } else if (progressState.filter.isActive) {
                  progressState.filter.progress = {
                    offersLoaded: progress.offersLoaded,
                    pagesLoaded: progress.pagesLoaded,
                  };
                }

                try {
                  chrome.runtime.sendMessage({
                    type: "PAGINATION_PROGRESS",
                    offersLoaded: progress.offersLoaded,
                    pagesLoaded: progress.pagesLoaded,
                  }).catch((err) => {
                    console.log('[Pagination] Failed to send progress message:', err);
                  });
                } catch (error) {
                  console.log('[Pagination] Error sending progress:', error);
                }
              }
            }
          }

          const resultElement = document.getElementById('c1-pagination-result');
          console.log('[Pagination] Checking for result element:', resultElement);

          if (resultElement) {
            cleanup();
            const result = parsePaginationResult(resultElement);
            console.log('[Pagination] Pagination complete, pages loaded:', result.pagesLoaded);

            resultElement.remove();
            const progressEl = document.getElementById('c1-pagination-progress');
            if (progressEl) progressEl.remove();

            resolve(result.pagesLoaded);
            return;
          }

          attempts++;
          if (attempts >= maxWaitAttempts) {
            cleanup();
            console.warn('[Pagination] Timeout waiting for pagination result');

            const progressEl = document.getElementById('c1-pagination-progress');
            const resultEl = document.getElementById('c1-pagination-result');
            if (progressEl) progressEl.remove();
            if (resultEl) resultEl.remove();

            resolve(0);
          }
        }, 250);
      };

      script.onerror = (error) => {
        console.error('[Pagination] Error loading pagination script:', error);
        script.remove();
        cleanup();

        const progressEl = document.getElementById('c1-pagination-progress');
        const resultEl = document.getElementById('c1-pagination-result');
        if (progressEl) progressEl.remove();
        if (resultEl) resultEl.remove();

        resolve(0);
      };

      (document.head || document.documentElement).appendChild(script);
    } catch (error) {
      console.error('[Pagination] Error executing pagination script:', error);
      cleanup();

      const progressEl = document.getElementById('c1-pagination-progress');
      const resultEl = document.getElementById('c1-pagination-result');
      if (progressEl) progressEl.remove();
      if (resultEl) resultEl.remove();

      resolve(0);
    }
  });
}

export async function loadAllTiles(fullyPaginated: { value: boolean }): Promise<number> {
  console.log('[Pagination] loadAllTiles started', {
    fullyPaginatedValue: fullyPaginated.value
  });

  if (fullyPaginated.value) {
    console.log('[Pagination] Already fully paginated, returning early');
    return 0;
  }

  const initialButton = findViewMoreButton();
  console.log('[Pagination] Initial "View More Offers" button:', {
    found: !!initialButton,
    buttonText: initialButton?.textContent?.trim(),
    buttonClasses: initialButton?.className
  });

  if (!initialButton) {
    console.log('[Pagination] No initial button found, marking as fully paginated');
    fullyPaginated.value = true;
    return 0;
  }

  const pagesLoaded = await executePaginationInPageContext();
  fullyPaginated.value = true;
  return pagesLoaded;
}
