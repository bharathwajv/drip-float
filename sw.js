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
});