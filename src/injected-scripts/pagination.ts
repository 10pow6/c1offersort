/**
 * Pagination script injected into page context to access React internals.
 * Duplicates some domHelpers functions to run in page context (necessary for DOM bridge pattern).
 *
 * IMPORTANT: This script cannot import from other modules as it runs in page context.
 * All timing constants are defined here. Modify these values to change pagination behavior.
 */

(async function paginateInPageContext() {
  // ========================================
  // PAGINATION TIMING CONSTANTS
  // Change these values to tune pagination performance
  // ========================================
  const INITIAL_DELAY = 150; // ms - starting delay for first pagination attempt
  const MIN_DELAY = 150; // ms - floor (fastest possible delay for fast connections)
  const MAX_DELAY = 4000; // ms - ceiling (slowest delay for slow connections)
  const RETRY_DELAY = 150; // ms - delay between retries when button not found
  const MAX_RETRIES = 2; // number of quick retries before giving up on button
  const FAST_THRESHOLD = 250; // ms - response time considered "fast" (speed up more)
  const SLOW_THRESHOLD = 800; // ms - response time considered "slow" (don't speed up)

  console.log('[Pagination Injected] Running in page context');

  function countRealTiles(): number {
    const allTiles = document.querySelectorAll('[data-testid^="feed-tile-"]');
    let count = 0;
    for (const tile of allTiles) {
      const testId = tile.getAttribute('data-testid') || '';
      if (!testId.includes('skeleton') && !testId.includes('carousel')) {
        count++;
      }
    }
    return count;
  }

  function findViewMoreButton(): HTMLButtonElement | null {
    const allButtons = document.querySelectorAll("button");
    const button = Array.from(allButtons).find(
      btn => btn.textContent && btn.textContent.trim() === "View More Offers"
    );
    return button as HTMLButtonElement || null;
  }

  async function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function withPreservedScroll(fn: () => void): void {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    fn();
    window.scrollTo(scrollX, scrollY);
  }

  function triggerReactClick(element: HTMLElement): boolean {
    // Method 1: Direct React props click (most reliable for React apps)
    const propsKey = Object.keys(element).find(key => key.startsWith('__reactProps'));
    if (propsKey) {
      const props = (element as any)[propsKey];
      if (props && props.onClick) {
        console.log('[Pagination Injected] Triggering React onClick handler directly');
        props.onClick();
        return true;
      }
    }

    // Method 2: Fallback to event dispatch
    console.log('[Pagination Injected] React props not found, falling back to event dispatch');
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Dispatch all mouse events
    ['mousedown', 'mouseup', 'click'].forEach(eventType => {
      const event = new MouseEvent(eventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0
      });
      element.dispatchEvent(event);
    });

    // Also trigger pointer events
    ['pointerdown', 'pointerup'].forEach(eventType => {
      const event = new PointerEvent(eventType, {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0,
        pointerType: 'mouse'
      });
      element.dispatchEvent(event);
    });

    return false;
  }

  let pagesLoaded = 0;
  let currentDelay = INITIAL_DELAY;
  const maxAttempts = 50;
  let consecutiveFailures = 0;
  const maxConsecutiveFailures = 3;

  console.log('[Pagination Injected] Starting pagination loop with adaptive delays');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let button = findViewMoreButton();

    if (!button) {
      console.log('[Pagination Injected] Button not found on attempt', attempt + 1, '- retrying...');

      for (let retry = 0; retry < MAX_RETRIES; retry++) {
        await wait(RETRY_DELAY);
        button = findViewMoreButton();
        if (button) {
          console.log('[Pagination Injected] Button found after', retry + 1, 'retries, continuing...');
          break;
        }
      }

      if (!button) {
        console.log('[Pagination Injected] Button still not found after retries - stopping');
        break;
      }
    }

    if (consecutiveFailures >= maxConsecutiveFailures) {
      console.log('[Pagination Injected] Reached max consecutive failures (', maxConsecutiveFailures, ') - all offers loaded');
      break;
    }

    const beforeCount = countRealTiles();
    console.log('[Pagination Injected] Attempt', attempt + 1, '- button found, current tiles:', beforeCount);

    const clickStartTime = Date.now();

    withPreservedScroll(() => {
      const reactClickSucceeded = triggerReactClick(button);
      if (!reactClickSucceeded) {
        button.click();
      }
    });

    console.log('[Pagination Injected] Button clicked, waiting', currentDelay, 'ms before checking...');
    await wait(currentDelay);

    const afterCount = countRealTiles();
    const responseTime = Date.now() - clickStartTime;
    console.log('[Pagination Injected] After wait, tiles:', afterCount, 'diff:', afterCount - beforeCount, 'response time:', responseTime, 'ms');

    if (afterCount > beforeCount) {
      pagesLoaded++;
      consecutiveFailures = 0;
      console.log('[Pagination Injected] New tiles loaded! Total pages:', pagesLoaded);

      let progressElement = document.getElementById('c1-pagination-progress');
      if (!progressElement) {
        progressElement = document.createElement('div');
        progressElement.id = 'c1-pagination-progress';
        progressElement.style.display = 'none';
        document.body.appendChild(progressElement);
      }
      progressElement.setAttribute('data-offers-loaded', afterCount.toString());
      progressElement.setAttribute('data-pages-loaded', pagesLoaded.toString());
      progressElement.setAttribute('data-timestamp', Date.now().toString());

      // Adaptive delay based on actual performance
      if (responseTime < FAST_THRESHOLD) {
        // Response was fast - speed up aggressively
        currentDelay = Math.max(currentDelay * 0.85, MIN_DELAY);
        console.log('[Pagination Injected] Fast response detected (', responseTime, 'ms) - reducing delay to', Math.round(currentDelay), 'ms');
      } else if (responseTime < SLOW_THRESHOLD) {
        // Normal response - modest speedup
        currentDelay = Math.max(currentDelay * 0.92, MIN_DELAY);
        console.log('[Pagination Injected] Normal response (', responseTime, 'ms) - reducing delay to', Math.round(currentDelay), 'ms');
      } else {
        // Slow response - don't change delay yet
        console.log('[Pagination Injected] Slow response (', responseTime, 'ms) - keeping delay at', Math.round(currentDelay), 'ms');
      }
    } else {
      consecutiveFailures++;
      console.log('[Pagination Injected] No new tiles detected (failure', consecutiveFailures, ')');

      if (consecutiveFailures === 1) {
        currentDelay = Math.min(currentDelay * 1.6, MAX_DELAY);
      } else if (consecutiveFailures === 2) {
        currentDelay = Math.min(currentDelay * 2, MAX_DELAY);
      } else {
        currentDelay = MAX_DELAY;
      }

      console.log('[Pagination Injected] Increased delay to', Math.round(currentDelay), 'ms');
    }
  }

  console.log('[Pagination Injected] Pagination complete, pages loaded:', pagesLoaded);

  const resultElement = document.createElement('div');
  resultElement.id = 'c1-pagination-result';
  resultElement.setAttribute('data-pages-loaded', pagesLoaded.toString());
  resultElement.style.display = 'none';
  document.body.appendChild(resultElement);
})();
