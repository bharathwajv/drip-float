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
    console.log('Service worker: Received CHECK_SITE_ACCESS message from:', sender.tab.url);
    // Check if current site should have access to the overlay
    checkSiteAccess(sender.tab.url).then(hasAccess => {
      console.log('Service worker: Sending site access response:', hasAccess);
      sendResponse({ ok: true, hasAccess });
    });
    return true; // async
  }
});

// Check if a site should have access to the overlay
async function checkSiteAccess(url) {
  try {
    console.log('Checking site access for:', url);
    
    // Get user sites, default sites, and removed default sites
    const [userSitesResult, defaultSitesResult, removedSitesResult] = await Promise.all([
      new Promise(resolve => chrome.storage.local.get(['userSites'], resolve)),
      import('./config/sites.js'),
      new Promise(resolve => chrome.storage.local.get(['removedDefaultSites'], resolve))
    ]);
    
    const userSites = userSitesResult.userSites || [];
    const { DEFAULT_SITES } = defaultSitesResult;
    const removedDefaultSites = removedSitesResult.removedDefaultSites || [];
    
    console.log('User sites:', userSites);
    console.log('Default sites:', DEFAULT_SITES);
    console.log('Removed default sites:', removedDefaultSites);
    
    // Check if URL matches any allowed site (excluding removed default sites)
    const hasAccess = userSites.some(site => url.startsWith(site.url)) ||
                     DEFAULT_SITES.some(site => {
                       const isRemoved = removedDefaultSites.includes(site.url);
                       return !isRemoved && url.startsWith(site.url);
                     });
    
    console.log('Site access result:', hasAccess);
    return hasAccess;
  } catch (error) {
    console.error('Error checking site access:', error);
    return false;
  }
}

