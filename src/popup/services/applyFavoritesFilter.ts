import type { FavoritesResult } from "../../types";
import { getCurrentTab, sendMessageToTab } from "./chromeApi";

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
    const result = await sendMessageToTab<FavoritesResult>(activeTab.id, {
      type: 'FILTER_REQUEST',
      showFavoritesOnly,
    });

    return result;
  } catch (error) {
    console.error("[Favorites Filter] Failed:", error);
    return {
      success: false,
      favoritesCount: 0,
      error: error instanceof Error ? error.message : "Filter failed",
    };
  }
}
