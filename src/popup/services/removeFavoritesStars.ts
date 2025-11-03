import { getCurrentTab, sendMessageToTab } from "./chromeApi";

/**
 * Disables the favorites feature in the active tab by removing all star buttons
 * and disconnecting the MutationObserver that watches for new tiles.
 *
 * @returns Result with success status, number of stars removed, and any errors
 */
export async function removeFavoritesStarsInActiveTab(): Promise<{ success: boolean; starsRemoved: number; error?: string }> {
  const activeTab = await getCurrentTab();

  if (!activeTab?.id) {
    return {
      success: false,
      starsRemoved: 0,
      error: "No active tab found",
    };
  }

  try {
    const result = await sendMessageToTab<{ success: boolean; starsRemoved: number }>(activeTab.id, {
      type: 'REMOVE_FAVORITES_REQUEST',
    });

    return result;
  } catch (error) {
    console.error("Remove favorites stars failed:", error);
    return {
      success: false,
      starsRemoved: 0,
      error: error instanceof Error ? error.message : "Remove failed",
    };
  }
}
