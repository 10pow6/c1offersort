/**
 * Chrome messaging API wrapper
 * Provides type-safe abstraction over chrome.runtime.sendMessage and chrome.tabs.sendMessage
 */

// Generic message and response types
type Message = Record<string, any>;
type MessageResponse = Record<string, any>;

/**
 * Send message to background script
 */
export async function sendToBackground<T extends Message>(message: T): Promise<MessageResponse> {
  try {
    const response = await chrome.runtime.sendMessage(message);
    return response as MessageResponse;
  } catch (error) {
    console.error('[MessagingAdapter] Failed to send message to background:', error);
    throw error;
  }
}

/**
 * Send message to content script in active tab
 */
export async function sendToActiveTab<T extends Message>(message: T): Promise<MessageResponse> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) {
      throw new Error('No active tab found');
    }

    const response = await chrome.tabs.sendMessage(tabs[0].id, message);
    return response as MessageResponse;
  } catch (error) {
    console.error('[MessagingAdapter] Failed to send message to active tab:', error);
    throw error;
  }
}

/**
 * Send message to specific tab
 */
export async function sendToTab<T extends Message>(tabId: number, message: T): Promise<MessageResponse> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    return response as MessageResponse;
  } catch (error) {
    console.error(`[MessagingAdapter] Failed to send message to tab ${tabId}:`, error);
    throw error;
  }
}

/**
 * Setup message listener
 */
export function onMessage(
  callback: (message: Message, sender: chrome.runtime.MessageSender) => Promise<MessageResponse> | MessageResponse
): () => void {
  const listener = (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    Promise.resolve(callback(message, sender))
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  };

  chrome.runtime.onMessage.addListener(listener);

  return () => {
    chrome.runtime.onMessage.removeListener(listener);
  };
}
