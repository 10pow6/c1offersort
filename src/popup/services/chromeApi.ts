import type { SortResult, SortConfig } from "../../types";
import { SortingError, ErrorCodes } from "../../utils/errors";

/**
 * Gets the currently active tab in the current window.
 *
 * @returns The active tab object, or undefined if no tab is active
 */
export async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return activeTab;
}

/**
 * Ensures the content script is loaded in the specified tab.
 * Attempts to ping the content script first, and injects it if not present.
 *
 * @param tabId - The ID of the tab to check/inject content script into
 */
async function ensureContentScriptLoaded(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
  } catch (error) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Sends a message to a specific tab and returns the response.
 * Ensures the content script is loaded before sending the message.
 *
 * @param tabId - The ID of the tab to send the message to
 * @param message - The message object to send
 * @returns The response from the content script
 */
export async function sendMessageToTab<T>(tabId: number, message: Record<string, unknown>): Promise<T> {
  await ensureContentScriptLoaded(tabId);

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response as T);
      }
    });
  });
}

/**
 * Executes sorting in the active tab by sending a message to the content script.
 *
 * @param sortConfig - Configuration specifying sort criteria and order
 * @returns Result object with success status, tiles processed, and any errors
 */
export async function executeSortInActiveTab(sortConfig: SortConfig): Promise<SortResult> {
  const activeTab = await getCurrentTab();

  if (!activeTab) {
    const error = new SortingError(
      "No active tab found in the current window",
      ErrorCodes.NO_ACTIVE_TAB,
      { windowId: chrome.windows.WINDOW_ID_CURRENT }
    );
    console.error(error.getDebugMessage());
    return {
      success: false,
      tilesProcessed: 0,
      pagesLoaded: 0,
      error: error.getUserMessage(),
    };
  }

  if (!activeTab.id) {
    const error = new SortingError(
      "Active tab exists but has no ID",
      ErrorCodes.INVALID_TAB_ID,
      { tab: { id: activeTab.id, url: activeTab.url, title: activeTab.title } }
    );
    console.error(error.getDebugMessage());
    return {
      success: false,
      tilesProcessed: 0,
      pagesLoaded: 0,
      error: error.getUserMessage(),
    };
  }

  try {
    const result = await sendMessageToTab<SortResult>(activeTab.id, {
      type: 'SORT_REQUEST',
      criteria: sortConfig.criteria,
      order: sortConfig.order,
    });

    return result;
  } catch (error) {
    console.error("Sort failed:", error);
    return {
      success: false,
      tilesProcessed: 0,
      pagesLoaded: 0,
      error: error instanceof Error ? error.message : "Failed to communicate with page",
    };
  }
}
