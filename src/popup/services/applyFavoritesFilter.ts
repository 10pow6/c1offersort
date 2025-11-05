import type { FavoritesResult } from "../../types";
import { getCurrentTab } from "./chromeApi";
import { MessageBus } from "../../messaging";
import type { FilterRequestMessage } from "../../types/messages";

/**
 * Applies or removes the favorites filter in the active tab.
 * When enabled, hides non-favorited offers. When disabled, shows all offers.
 *
 * @param showFavoritesOnly - If true, show only favorited offers; if false, show all
 * @returns Result with success status, tile counts, and list of missing favorites
 */
export async function applyFavoritesFilterInActiveTab(
  showFavoritesOnly: boolean
): Promise<FavoritesResult> {
  const activeTab = await getCurrentTab();

  if (!activeTab?.id) {
    return {
      success: false,
      favoritesCount: 0,
      error: "No active tab found",
    };
  }

  try {
    const message: FilterRequestMessage = {
      type: 'FILTER_REQUEST',
      showFavoritesOnly,
    };
    const result = await MessageBus.sendToTab<FilterRequestMessage>(activeTab.id, message) as FavoritesResult;

    return result;
  } catch (error) {
    console.error("[Favorites Filter] Failed:", error);

    let errorMessage = "Filter failed";
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
      favoritesCount: 0,
      error: errorMessage,
    };
  }
}
