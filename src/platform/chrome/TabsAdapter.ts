/**
 * Chrome tabs API wrapper
 * Provides type-safe abstraction over chrome.tabs API
 */

/**
 * Get current active tab
 */
export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
  } catch (error) {
    console.error('[TabsAdapter] Failed to get active tab:', error);
    throw error;
  }
}

/**
 * Get tab by ID
 */
export async function getTab(tabId: number): Promise<chrome.tabs.Tab> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return tab;
  } catch (error) {
    console.error(`[TabsAdapter] Failed to get tab ${tabId}:`, error);
    throw error;
  }
}

/**
 * Query tabs
 */
export async function queryTabs(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
  try {
    const tabs = await chrome.tabs.query(queryInfo);
    return tabs;
  } catch (error) {
    console.error('[TabsAdapter] Failed to query tabs:', error);
    throw error;
  }
}

/**
 * Create new tab
 */
export async function createTab(createProperties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> {
  try {
    const tab = await chrome.tabs.create(createProperties);
    return tab;
  } catch (error) {
    console.error('[TabsAdapter] Failed to create tab:', error);
    throw error;
  }
}

/**
 * Update tab
 */
export async function updateTab(
  tabId: number,
  updateProperties: chrome.tabs.UpdateProperties
): Promise<chrome.tabs.Tab> {
  try {
    const tab = await chrome.tabs.update(tabId, updateProperties);
    return tab;
  } catch (error) {
    console.error(`[TabsAdapter] Failed to update tab ${tabId}:`, error);
    throw error;
  }
}

/**
 * Reload tab
 */
export async function reloadTab(tabId: number): Promise<void> {
  try {
    await chrome.tabs.reload(tabId);
  } catch (error) {
    console.error(`[TabsAdapter] Failed to reload tab ${tabId}:`, error);
    throw error;
  }
}

/**
 * Close tab
 */
export async function closeTab(tabId: number): Promise<void> {
  try {
    await chrome.tabs.remove(tabId);
  } catch (error) {
    console.error(`[TabsAdapter] Failed to close tab ${tabId}:`, error);
    throw error;
  }
}

/**
 * Listen for tab updates
 */
export function onTabUpdated(
  callback: (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => void
): () => void {
  chrome.tabs.onUpdated.addListener(callback);

  return () => {
    chrome.tabs.onUpdated.removeListener(callback);
  };
}

/**
 * Listen for tab activation
 */
export function onTabActivated(
  callback: (activeInfo: chrome.tabs.TabActiveInfo) => void
): () => void {
  chrome.tabs.onActivated.addListener(callback);

  return () => {
    chrome.tabs.onActivated.removeListener(callback);
  };
}
