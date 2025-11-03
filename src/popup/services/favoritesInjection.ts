import type { FavoritesResult } from "../../types";
import { getCurrentTab, sendMessageToTab } from "./chromeApi";

/**
 * Enables the favorites feature in the active tab by injecting star buttons into offer tiles.
 * Sends a message to the content script to perform the injection and set up observers.
 *
 * @returns Result with success status and current favorites count
 */
export async function injectFavoritesInActiveTab(): Promise<FavoritesResult> {
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
      type: 'INJECT_FAVORITES_REQUEST',
    });

    return result;
  } catch (error) {
    console.error("[Favorites] Injection failed:", error);
    return {
      success: false,
      favoritesCount: 0,
      error: error instanceof Error ? error.message : "Injection failed",
    };
  }
}
