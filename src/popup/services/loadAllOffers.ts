import { getCurrentTab, sendMessageToTab } from "./chromeApi";

/**
 * Loads all offers in the active tab by triggering pagination to click through all "View More" buttons.
 * This ensures all offers are visible before applying filters or sorting.
 *
 * @returns Result with success status, number of offers loaded, and any errors
 */
export async function loadAllOffersInActiveTab(): Promise<{ success: boolean; offersLoaded: number; error?: string }> {
  const activeTab = await getCurrentTab();

  if (!activeTab?.id) {
    console.error("No active tab found");
    return {
      success: false,
      offersLoaded: 0,
      error: "No active tab found",
    };
  }

  try {
    const result = await sendMessageToTab<{ success: boolean; offersLoaded: number; pagesLoaded: number; error?: string }>(activeTab.id, {
      type: 'LOAD_ALL_REQUEST',
    });

    return result;
  } catch (error) {
    console.error("Load all offers failed:", error);
    return {
      success: false,
      offersLoaded: 0,
      error: error instanceof Error ? error.message : "Load failed",
    };
  }
}
