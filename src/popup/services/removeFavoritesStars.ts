import { getCurrentTab } from "./chromeApi";
import { MessageBus } from "../../messaging";
import type { RemoveFavoritesRequestMessage } from "../../types/messages";

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
    const message: RemoveFavoritesRequestMessage = {
      type: 'REMOVE_FAVORITES_REQUEST',
    };
    const result = await MessageBus.sendToTab<RemoveFavoritesRequestMessage>(activeTab.id, message) as { success: boolean; starsRemoved: number };

    return result;
  } catch (error) {
    console.error("Remove favorites stars failed:", error);

    let errorMessage = "Remove failed";
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
      starsRemoved: 0,
      error: errorMessage,
    };
  }
}
