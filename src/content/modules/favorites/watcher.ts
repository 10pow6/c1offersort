import { shouldExcludeTile } from '../../../shared/domHelpers';
import { injectStarsIntoTiles } from './inject';

const ENABLED_KEY = "c1-favorites-enabled";

/**
 * Sets up a MutationObserver to watch for new tiles being added to the page
 * and automatically injects favorite stars into them when favorites are enabled.
 * Uses debouncing to avoid excessive DOM queries.
 *
 * @param processedTiles - Set to track which tiles have been processed
 */
export function setupTilesWatcher(processedTiles: Set<string>) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const scanForInitialTiles = async () => {
    try {
      const enabledResult = await chrome.storage.local.get(ENABLED_KEY);
      const isEnabled = enabledResult[ENABLED_KEY] === true;

      if (!isEnabled) {
        return;
      }

      const scanIntervals = [100, 300, 700, 1500];

      for (const interval of scanIntervals) {
        await new Promise((resolve) => setTimeout(resolve, interval));

        const checkEnabled = await chrome.storage.local.get(ENABLED_KEY);
        if (!checkEnabled[ENABLED_KEY]) {
          return;
        }

        const allTiles = document.querySelectorAll('[data-testid^="feed-tile-"]');
        const tilesToProcess: HTMLElement[] = [];

        for (const tile of Array.from(allTiles)) {
          const testId = tile.getAttribute("data-testid");
          if (testId && !processedTiles.has(testId) && !shouldExcludeTile(tile)) {
            tilesToProcess.push(tile as HTMLElement);
            processedTiles.add(testId);
          }
        }

        if (tilesToProcess.length > 0) {
          await injectStarsIntoTiles(tilesToProcess);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Extension context invalidated')) {
        return;
      }
      throw error;
    }
  };

  scanForInitialTiles();

  const observer = new MutationObserver(async (mutations) => {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = window.setTimeout(async () => {
      try {
        const enabledResult = await chrome.storage.local.get(ENABLED_KEY);
        const isEnabled = enabledResult[ENABLED_KEY] === true;

        if (!isEnabled) {
          return;
        }

        const tilesToProcess: HTMLElement[] = [];

        for (const mutation of mutations) {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node instanceof HTMLElement) {
              if (
                node.hasAttribute("data-testid") &&
                node.getAttribute("data-testid")?.startsWith("feed-tile-")
              ) {
                const testId = node.getAttribute("data-testid");
                if (
                  testId &&
                  !processedTiles.has(testId) &&
                  !shouldExcludeTile(node)
                ) {
                  tilesToProcess.push(node);
                  processedTiles.add(testId);
                }
              } else {
                const newTiles = node.querySelectorAll(
                  '[data-testid^="feed-tile-"]'
                );
                for (const tile of Array.from(newTiles)) {
                  const testId = tile.getAttribute("data-testid");
                  if (
                    testId &&
                    !processedTiles.has(testId) &&
                    !shouldExcludeTile(tile)
                  ) {
                    tilesToProcess.push(tile as HTMLElement);
                    processedTiles.add(testId);
                  }
                }
              }
            }
          }
        }

        if (tilesToProcess.length > 0) {
          await injectStarsIntoTiles(tilesToProcess);
        }

        debounceTimer = null;
      } catch (error) {
        if (error instanceof Error && error.message.includes('Extension context invalidated')) {
          debounceTimer = null;
          return;
        }
        throw error;
      }
    }, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-testid"],
  });

  window.addEventListener("beforeunload", () => {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    observer.disconnect();
    processedTiles.clear();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[ENABLED_KEY]) {
      if (!changes[ENABLED_KEY].newValue) {
        if (debounceTimer !== null) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
        observer.disconnect();
        processedTiles.clear();
      }
    }
  });
}
