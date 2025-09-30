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

  // Expose database access for other parts of the extension
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_DATABASE') {
      // This will allow content scripts or popup to request database access
      sendResponse({ success: true });
      return true;
    }
  });
  // FIXME:: expose to windows for testing
  globalThis.wardLookup = wardLookup;
  globalThis.db = dataSetup.getDatabase();
});
