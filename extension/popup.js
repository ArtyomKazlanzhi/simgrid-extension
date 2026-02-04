// popup.js - RaceStand Importer Popup

(function() {
  'use strict';

  const statusEl = document.getElementById('status');
  const statusTextEl = document.getElementById('status-text');
  const importBtn = document.getElementById('import-btn');

  // Check if current tab is a SimGrid championship page
  async function checkCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) {
        setStatus('inactive', 'Unable to detect page');
        return;
      }

      const url = tab.url;
      const isSimGrid = url.includes('thesimgrid.com');
      const isStandings = url.includes('/championships/') && url.includes('/standings');

      if (isSimGrid && isStandings) {
        setStatus('active', 'SimGrid Standings Page');
        importBtn.disabled = false;
      } else if (isSimGrid) {
        setStatus('inactive', 'SimGrid (not standings page)');
      } else {
        setStatus('inactive', 'Not a SimGrid page');
      }
    } catch (error) {
      console.error('[RaceStand Popup] Error:', error);
      setStatus('inactive', 'Error detecting page');
    }
  }

  function setStatus(type, text) {
    statusEl.className = 'status ' + type;
    statusTextEl.textContent = text;
  }

  // Handle import button click
  importBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        alert('Could not find active tab');
        return;
      }

      // Send message to content script to trigger import
      chrome.tabs.sendMessage(tab.id, { action: 'triggerImport' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[RaceStand Popup] Error:', chrome.runtime.lastError);
          alert('Could not communicate with page. Try refreshing the SimGrid page.');
        } else if (response && response.success) {
          window.close();
        }
      });
    } catch (error) {
      console.error('[RaceStand Popup] Error:', error);
      alert('An error occurred. Please try again.');
    }
  });

  // Initialize
  checkCurrentPage();
})();
