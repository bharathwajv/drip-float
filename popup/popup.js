// popup/popup.js
import { StorageService } from './storageService.js';

(() => {
  // Initialize storage service
  const storageService = new StorageService();
  
  // DOM elements
  const historyBtn = document.getElementById('historyBtn');
  const overlayBtn = document.getElementById('overlayBtn');
  const overlayBtnText = document.getElementById('overlayBtnText');
  const settingsBtn = document.getElementById('settingsBtn');
  const addCurrentSiteBtn = document.getElementById('addCurrentSiteBtn');

  // State
  let overlayVisible = false;

  // Initialize
  const init = async () => {
    console.log('Initializing popup...');
    await loadPopupSettings();
    await checkOverlayState();
    await checkCurrentSiteStatus();
    setupEventListeners();
    setupStorageListener(); // Setup storage listener
    console.log('Popup initialization complete');
  };

  // Check overlay state
  const checkOverlayState = async () => {
    try {
      const result = await chrome.storage.local.get(['overlayVisible']);
      overlayVisible = result.overlayVisible !== false; // Default to true if not set
      updateOverlayButtonState();
    } catch (error) {
      console.error('Error checking overlay state:', error);
      overlayVisible = true;
      updateOverlayButtonState();
    }
  };

  // Update overlay button state
  const updateOverlayButtonState = () => {
    if (overlayVisible) {
      overlayBtn.classList.remove('hidden');
      overlayBtnText.textContent = 'Hide Overlay';
    } else {
      overlayBtn.classList.add('hidden');
      overlayBtnText.textContent = 'Show Overlay';
    }
  };

  // Load popup settings
  const loadPopupSettings = async () => {
    try {
      console.log('Loading popup settings...');
      // Set default dimensions
      document.body.style.width = '380px';
      document.body.style.height = '500px';
      console.log('Applied default dimensions: 380 x 500');
    } catch (error) {
      console.error('Error loading popup settings:', error);
      // Use default dimensions if there's an error
      document.body.style.width = '380px';
      document.body.style.height = '500px';
      console.log('Applied fallback dimensions: 380 x 500');
    }
  };

  // Setup event listeners
  const setupEventListeners = () => {
    historyBtn.addEventListener('click', openDashboard);
    settingsBtn.addEventListener('click', openDashboard);
    overlayBtn.addEventListener('click', toggleOverlay);
    addCurrentSiteBtn.addEventListener('click', addCurrentSite);
  };

  // Setup storage listener for real-time updates
  const setupStorageListener = () => {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        if (changes.customSites || changes.removedDefaultSites) {
          console.log('Sites changed, updating popup...');
          checkCurrentSiteStatus();
        }
        if (changes.overlayVisible !== undefined) {
          console.log('Overlay visibility changed, updating popup...');
          checkOverlayState();
        }
      }
    });

    // Listen for messages from options page
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SITES_CHANGED') {
        console.log('Received sites changed message, updating popup...');
        checkCurrentSiteStatus();
        sendResponse({ ok: true });
      }
    });
  };


  // Toggle overlay
  const toggleOverlay = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_OVERLAY' }, (response) => {
          if (response && response.ok) {
            overlayVisible = !overlayVisible;
            updateOverlayButtonState();
            // Save state to storage
            chrome.storage.local.set({ overlayVisible: overlayVisible });
          }
        });
      }
    });
  };

  // Open dashboard
  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/dashboard.html') });
  };

  // Add current site to supported sites
  const addCurrentSite = async () => {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        console.error('Could not get current tab information');
        return;
      }
      
      const currentUrl = tab.url;
      const hostname = new URL(currentUrl).hostname.replace('www.', '');
      const siteName = hostname.charAt(0).toUpperCase() + hostname.slice(1);
      const siteIcon = hostname.charAt(0).toUpperCase();
      
      // Check if site is already in the list
      const userSites = await storageService.getUserSites();
      
      // Check if site already exists (either in user sites or default sites)
      const { DEFAULT_SITES } = await import('../config/sites.js');
      const defaultSiteUrls = DEFAULT_SITES.map(site => site.url);
      
      // Get removed default sites
      const result = await chrome.storage.local.get(['removedDefaultSites']);
      const removedDefaultSites = result.removedDefaultSites || [];
      
      const isAlreadyInList = userSites.some(site => site.url === currentUrl) || 
          defaultSiteUrls.some(url => {
            const matchesPattern = currentUrl.startsWith(url);
            const isRemoved = removedDefaultSites.includes(url);
            return matchesPattern && !isRemoved;
          });
      
      if (isAlreadyInList) {
        console.log('This site is already in your supported sites list');
        return;
      }
      
      // If it was previously removed from default sites, remove it from removed list
      if (removedDefaultSites.includes(currentUrl)) {
        const updatedRemovedSites = removedDefaultSites.filter(site => site !== currentUrl);
        await chrome.storage.local.set({ removedDefaultSites: updatedRemovedSites });
        console.log('Site restored to default supported sites!');
      } else {
        // Add the new site to user sites
        const newSite = {
          url: currentUrl,
          name: siteName,
          icon: siteIcon
        };
        
        await storageService.addUserSite(newSite);
        console.log(`${siteName} added to supported sites!`);
      }
      
      // Update the button text temporarily
      const originalText = addCurrentSiteBtn.innerHTML;
      addCurrentSiteBtn.innerHTML = '✅ Added!';
      addCurrentSiteBtn.disabled = true;
      
      setTimeout(() => {
        addCurrentSiteBtn.innerHTML = originalText;
        addCurrentSiteBtn.disabled = false;
        // Re-check status to update button state
        checkCurrentSiteStatus();
      }, 2000);
      
    } catch (error) {
      console.error('Error adding current site:', error);
    }
  };

  // Check current site status and update button
  const checkCurrentSiteStatus = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;
      
      const currentUrl = tab.url;
      const userSites = await storageService.getUserSites();
      
      // Get default sites and removed default sites
      const { DEFAULT_SITES } = await import('../config/sites.js');
      const defaultSiteUrls = DEFAULT_SITES.map(site => site.url);
      
      // Get removed default sites
      const result = await chrome.storage.local.get(['removedDefaultSites']);
      const removedDefaultSites = result.removedDefaultSites || [];
      
      // Check if current site is already in the list
      const isSiteInList = userSites.some(site => site.url === currentUrl) || 
                          defaultSiteUrls.some(url => {
                            // Check if current URL matches default site pattern and is not removed
                            const matchesPattern = currentUrl.startsWith(url);
                            const isRemoved = removedDefaultSites.includes(url);
                            return matchesPattern && !isRemoved;
                          });
      
      const siteStatusText = document.getElementById('siteStatusText');
      
      if (isSiteInList) {
        // Site is already in list, show remove button
        addCurrentSiteBtn.innerHTML = '🗑️ Remove Site';
        addCurrentSiteBtn.classList.add('remove-mode');
        addCurrentSiteBtn.onclick = removeCurrentSite;
        
        // Hide the descriptive text
        if (siteStatusText) {
          siteStatusText.textContent = 'remove this page from supported sites list';
        }
      } else {
        // Site is not in list, show add button
        addCurrentSiteBtn.innerHTML = '🌐 Add Current Site';
        addCurrentSiteBtn.classList.remove('remove-mode');
        addCurrentSiteBtn.onclick = addCurrentSite;
      }
    } catch (error) {
      console.error('Error checking current site status:', error);
    }
  };

  // Remove current site from supported sites
  const removeCurrentSite = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;
      
      const currentUrl = tab.url;
      const userSites = await storageService.getUserSites();
      
      // Check if it's a default site
      const { DEFAULT_SITES } = await import('../config/sites.js');
      const defaultSiteUrls = DEFAULT_SITES.map(site => site.url);
      const isDefaultSite = defaultSiteUrls.some(url => currentUrl.startsWith(url));
      
      if (isDefaultSite) {
        // Remove from default sites by adding to removed list
        const result = await chrome.storage.local.get(['removedDefaultSites']);
        const removedSites = result.removedDefaultSites || [];
        
        if (!removedSites.includes(currentUrl)) {
          removedSites.push(currentUrl);
          await chrome.storage.local.set({ removedDefaultSites: removedSites });
          console.log('Default site removed from supported sites!');
        }
      } else {
        // Remove from user sites if it exists there
        if (userSites.some(site => site.url === currentUrl)) {
          await storageService.removeUserSite(currentUrl);
          console.log('Site removed from supported sites!');
        }
      }
      
      // Update button back to add mode
      addCurrentSiteBtn.innerHTML = '🌐 Add Current Site';
      addCurrentSiteBtn.classList.remove('remove-mode');
      addCurrentSiteBtn.onclick = addCurrentSite;
      
    } catch (error) {
      console.error('Error removing current site:', error);
    }
  };









  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
