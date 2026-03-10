import { DataSetup } from '~/utils/data-setup';
import { wardLookup } from '~/utils/ward-lookup';

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
      wardLookup.findNewWardsByNameAndProvince(message.wardName, message.provinceName).then(sendResponse);
      return true;
    }
    if (message.type === 'LOOKUP_OLD_WARDS_FROM_NEW') {
      wardLookup.getOldWardsFromNew(message.wardCode).then(sendResponse);
      return true;
    }
    return false;
  });

  // FIXME:: expose to windows for testing
  globalThis.wardLookup = wardLookup;
  globalThis.db = dataSetup.getDatabase();
});
