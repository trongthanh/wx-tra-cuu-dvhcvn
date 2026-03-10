import { DataSetup } from '~/utils/data-setup';
import { wardLookup } from '~/utils/ward-lookup';

// Track annotation counts per tab
const tabAnnotationCounts = new Map<number, number>();

export default defineBackground(() => {
  console.log('Background script initialized', { id: browser.runtime.id });

  // Initialize data setup when extension starts
  const dataSetup = new DataSetup();

  // Handle installation/update events
  browser.runtime.onInstalled.addListener(async (details) => {
    console.log('Extension installed/updated:', details.reason);

    try {
      const wasUpdated = await dataSetup.checkAndUpdateData();
      if (wasUpdated) {
        console.log('Data updated after extension install/update');
      } else {
        console.log('Vietnam administrative units data is current');
      }
    } catch (error) {
      console.error('Error updating data after install/update:', error);
    }
  });

  // Update badge when active tab changes
  browser.tabs.onActivated.addListener(async (activeInfo) => {
    const count = tabAnnotationCounts.get(activeInfo.tabId) || 0;
    await updateBadge(count);
  });

  // Clear count when tab is closed
  browser.tabs.onRemoved.addListener((tabId) => {
    tabAnnotationCounts.delete(tabId);
  });

  // Clear count when tab navigates to a new page (URL change indicates actual navigation)
  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
      // URL changed - actual navigation
      tabAnnotationCounts.delete(tabId);
      // Clear badge if this is the active tab
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs[0]?.id === tabId) {
          updateBadge(0);
        }
      });
    }
  });

  // Handle messages from content scripts and popup
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_DATABASE') {
      sendResponse({ success: true });
      return true;
    }

    // Handle lookup requests from content scripts (they can't access extension IndexedDB)
    if (message.type === 'LOOKUP_ALL_OLD_PROVINCES') {
      wardLookup.getAllOldProvinces().then(sendResponse);
      return true;
    }
    if (message.type === 'LOOKUP_ALL_NEW_PROVINCES') {
      wardLookup.getAllNewProvinces().then(sendResponse);
      return true;
    }
    if (message.type === 'LOOKUP_NEW_WARDS_BY_NAME') {
      wardLookup.findNewWardsByName(message.wardName).then(sendResponse);
      return true;
    }
    if (message.type === 'LOOKUP_NEW_WARDS_BY_NAME_AND_PROVINCE') {
      wardLookup
        .findNewWardsByNameAndProvince(message.wardName, message.provinceName)
        .then(sendResponse);
      return true;
    }
    if (message.type === 'LOOKUP_OLD_WARDS_FROM_NEW') {
      wardLookup.getOldWardsFromNew(message.wardCode).then(sendResponse);
      return true;
    }

    // Handle annotation count from content script
    if (message.type === 'ANNOTATION_COUNT') {
      const tabId = _sender.tab?.id;
      if (tabId) {
        tabAnnotationCounts.set(tabId, message.count);
        // Update badge if this is the active tab
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          if (tabs[0]?.id === tabId) {
            updateBadge(message.count);
          }
        });
      }
      return false;
    }

    return false;
  });

  // FIXME:: expose to windows for testing
  // globalThis.wardLookup = wardLookup;
  // globalThis.db = dataSetup.getDatabase();
});

// Helper to update the extension badge
async function updateBadge(count: number): Promise<void> {
  const text = count > 0 ? count.toString() : '';
  const color = count > 0 ? '#7c3aed' : '#9ca3af'; // Purple for active, gray for none

  try {
    await browser.action.setBadgeText({ text });
    await browser.action.setBadgeBackgroundColor({ color });
  } catch {
    // Ignore errors (e.g., if action API is not available)
  }
}
