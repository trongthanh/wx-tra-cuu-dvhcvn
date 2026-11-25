import { DataSetup } from '~/utils/data-setup';
import { wardLookup } from '~/utils/ward-lookup';

// Track annotation counts per tab
const tabAnnotationCounts = new Map<number, number>();

export default defineBackground(() => {
  console.log('Background script initialized', { id: browser.runtime.id });

  // Initialize data setup when extension starts
  const dataSetup = new DataSetup();
  let dataReady: Promise<boolean> | undefined;
  function ensureDataReady() {
    return (dataReady ??= dataSetup.checkAndUpdateData().catch((error) => {
      dataReady = undefined;
      throw error;
    }));
  }

  // Handle installation/update events
  browser.runtime.onInstalled.addListener(async (details) => {
    console.log('Extension installed/updated:', details.reason);

    try {
      const wasUpdated = await ensureDataReady();
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

    // Content scripts must not read an empty or partially imported dataset on first load.
    function respondWithLookup(lookup: () => Promise<unknown[]>) {
      ensureDataReady()
        .then(lookup)
        .then(sendResponse, (error) => {
          console.error('Could not perform administrative lookup:', error);
          sendResponse([]);
        });
      return true;
    }

    switch (message.type) {
      case 'LOOKUP_ALL_OLD_PROVINCES':
        return respondWithLookup(() => wardLookup.getAllOldProvinces());
      case 'LOOKUP_ALL_NEW_PROVINCES':
        return respondWithLookup(() => wardLookup.getAllNewProvinces());
      case 'LOOKUP_NEW_WARDS_BY_NAME':
        return respondWithLookup(() => wardLookup.findNewWardsByName(message.wardName));
      case 'LOOKUP_NEW_WARDS_BY_NAME_AND_PROVINCE':
        return respondWithLookup(() =>
          wardLookup.findNewWardsByNameAndProvince(message.wardName, message.provinceName),
        );
      case 'LOOKUP_OLD_WARDS_FROM_NEW':
        return respondWithLookup(() => wardLookup.getOldWardsFromNew(message.wardCode));
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
    // Firefox MV2 uses browserAction; Chrome MV3 uses action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actionApi = browser.action ?? (browser as any).browserAction;
    if (actionApi) {
      await actionApi.setBadgeText({ text });
      await actionApi.setBadgeBackgroundColor({ color });
    }
  } catch {
    // Ignore errors (e.g., if action API is not available)
  }
}
