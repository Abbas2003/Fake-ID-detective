/**
 * Background script for Instagram Fake ID Detector extension
 */

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Instagram Fake ID Detector has been installed');
  
  // Initialize storage with default settings
  const defaultSettings = {
    darkMode: false,
    strictness: 2 // 1: Lenient, 2: Balanced, 3: Strict
  };
  
  chrome.storage.local.set({
    'instagram_fake_detector_settings': defaultSettings
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    // This would open the popup, but Chrome doesn't allow programmatically
    // opening the popup from content scripts. This is more for demonstration.
    console.log('Popup open request received (cannot be done programmatically)');
    sendResponse({ status: 'ok' });
  }
  
  return true; // Keep the message channel open for async responses
});

// Only add commands listener if the API is available
if (chrome.commands) {
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'analyze-profile') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // Check if we're on Instagram
        const tab = tabs[0];
        if (tab.url && tab.url.includes('instagram.com')) {
          console.log('Analyze shortcut pressed on Instagram');
        }
      });
    }
  });
}