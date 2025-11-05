import type { SortResult, SortConfig } from "../../types";
import { SortingError, ErrorCodes } from "../../utils/errors";
import { MessageBus } from "../../messaging";
import type { SortRequestMessage } from "../../types/messages";

export async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return activeTab;
}

export async function executeSortInActiveTab(sortConfig: SortConfig): Promise<SortResult> {
  console.log('[chromeApi] executeSortInActiveTab called with:', sortConfig);
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
    console.log('[chromeApi] Sending SORT_REQUEST to tab', activeTab.id);
    const message: SortRequestMessage = {
      type: 'SORT_REQUEST',
      criteria: sortConfig.criteria,
      order: sortConfig.order,
    };
    const result = await MessageBus.sendToTab<SortRequestMessage>(activeTab.id, message) as SortResult;

    console.log('[chromeApi] Received result:', result);
    return result;
  } catch (error) {
    console.error("[chromeApi] Sort failed:", error);

    // Provide user-friendly error messages
    let errorMessage = "Failed to communicate with page";

    if (error instanceof Error) {
      if (error.message.includes('Could not establish connection') ||
          error.message.includes('Receiving end does not exist')) {
        errorMessage = "Please refresh the Capital One page and try again";
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      tilesProcessed: 0,
      pagesLoaded: 0,
      error: errorMessage,
    };
  }
}
