// background.js - Service Worker for SimGrid to RaceStand Extension

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_RACESTAND') {
    // The data is already compressed by content.js
    const compressedData = message.data;

    // Construct the RaceStand URL with import parameter
    const racestandUrl = chrome.runtime.getURL(
      `racestand/racestand.html?import=${compressedData}`
    );

    // Open RaceStand in a new tab
    chrome.tabs.create({ url: racestandUrl });

    // Send response back to content script
    sendResponse({ success: true });
  }

  // Return true to indicate we will send a response asynchronously
  return true;
});

console.log('SimGrid to RaceStand Extension - Service Worker loaded');
