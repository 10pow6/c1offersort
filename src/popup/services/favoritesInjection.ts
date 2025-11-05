import type { FavoritesResult } from "../../types";
import { getCurrentTab } from "./chromeApi";
import { MessageBus } from "../../messaging";
import type { InjectFavoritesRequestMessage } from "../../types/messages";

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
    const message: InjectFavoritesRequestMessage = {
      type: 'INJECT_FAVORITES_REQUEST',
    };
    const result = await MessageBus.sendToTab<InjectFavoritesRequestMessage>(activeTab.id, message) as FavoritesResult;

    return result;
  } catch (error) {
    console.error("[Favorites] Injection failed:", error);

    let errorMessage = "Injection failed";
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
