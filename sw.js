// sw.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ showOverlayByDefault: true }, () => {});
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'OPEN_HISTORY_TAB') {
    // Open dashboard instead of separate history page
    const url = chrome.runtime.getURL('pages/dashboard.html');
    chrome.tabs.create({ url });
    sendResponse({ ok: true });
  }
  
  if (msg?.type === 'OPEN_DASHBOARD') {
    const url = chrome.runtime.getURL('pages/dashboard.html');
    chrome.tabs.create({ url });
    sendResponse({ ok: true });
  }
  
  if (msg?.type === 'GET_OPTIONS') {
    chrome.storage.local.get({ showOverlayByDefault: true }, (data) => {
      sendResponse({ ok: true, data });
    });
    return true; // async
  }
  
  if (msg?.type === 'SET_OPTIONS') {
    chrome.storage.local.set(msg.payload || {}, () => sendResponse({ ok: true }));
    return true; // async
  }
  
  if (msg?.type === 'TOGGLE_OVERLAY') {
    // Handle overlay toggle from popup
    chrome.storage.local.set({ overlayVisible: msg.visible }, () => {
      sendResponse({ ok: true, visible: msg.visible });
    });
    return true; // async
  }
  
  if (msg?.type === 'GET_OVERLAY_STATE') {
    chrome.storage.local.get(['overlayVisible', 'showOverlayByDefault'], (data) => {
      const visible = data.overlayVisible !== undefined ? data.overlayVisible : data.showOverlayByDefault;
      sendResponse({ ok: true, visible: visible });
    });
    return true; // async
  }
  
  if (msg?.type === 'UPDATE_TOKEN_USAGE') {
    // Handle token usage updates (for future implementation)
    chrome.storage.local.set({ tokenUsage: msg.data }, () => {
      sendResponse({ ok: true });
    });
    return true; // async
  }
  
  if (msg?.type === 'CHECK_SITE_ACCESS') {
    // Check if current site should have access to the overlay
    checkSiteAccess(sender.tab.url).then(hasAccess => {
      sendResponse({ ok: true, hasAccess });
    });
    return true; // async
  }
});

// Check if a site should have access to the overlay
async function checkSiteAccess(url) {
  try {
    // Get user sites and default sites
    const [userSitesResult, defaultSitesResult] = await Promise.all([
      new Promise(resolve => chrome.storage.local.get(['userSites'], resolve)),
      import('./config/sites.js')
    ]);
    
    const userSites = userSitesResult.userSites || [];
    const { DEFAULT_SITES } = defaultSitesResult;
    
    // Check if URL matches any allowed site
    const hasAccess = userSites.some(site => url.startsWith(site.url)) ||
                     DEFAULT_SITES.some(site => url.startsWith(site.url));
    
    return hasAccess;
  } catch (error) {
    console.error('Error checking site access:', error);
    return false;
  }
}

// Listen for tab updates to inject content script for user-added sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkSiteAccess(tab.url).then(hasAccess => {
      if (hasAccess) {
        // Inject content script if not already injected
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content/panel.js']
        }).catch(error => {
          // Script might already be injected, ignore error
          console.log('Content script injection skipped:', error.message);
        });
      }
    });
  }
});