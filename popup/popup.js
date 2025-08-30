// popup/popup.js
(() => {
  // Initialize storage service
  const storageService = new StorageService();
  
  // DOM elements
  const historyBtn = document.getElementById('historyBtn');
  const overlayBtn = document.getElementById('overlayBtn');
  const overlayBtnText = document.getElementById('overlayBtnText');
  const settingsBtn = document.getElementById('settingsBtn');
  const resizeToggle = document.getElementById('resizeToggle');
  const resizeHandle = document.getElementById('resizeHandle');
  const addCurrentSiteBtn = document.getElementById('addCurrentSiteBtn');
  const sizePresets = document.getElementById('sizePresets');

  // State
  let isResizable = true;
  let isResizing = false;
  let startX, startY, startWidth, startHeight;
  let overlayVisible = false;

  // Initialize
  const init = async () => {
    console.log('Initializing popup...');
    await loadPopupSettings();
    await checkOverlayState();
    setupEventListeners();
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
      const settings = await storageService.getPopupSettings();
      console.log('Loaded settings:', settings);
      isResizable = settings.isResizable;
      
      // Apply saved dimensions
      if (settings.width && settings.height) {
        document.body.style.width = `${settings.width}px`;
        document.body.style.height = `${settings.height}px`;
        console.log('Applied saved dimensions:', settings.width, 'x', settings.height);
        // Set active size preset button
        setActiveSizePreset(settings.width, settings.height);
      } else {
        // Set default dimensions if none exist
        document.body.style.width = '380px';
        document.body.style.height = '500px';
        console.log('Applied default dimensions: 380 x 500');
        setActiveSizePreset(380, 500);
      }
      
      updateResizeUI();
    } catch (error) {
      console.error('Error loading popup settings:', error);
      // Use default settings if there's an error
      isResizable = true;
      document.body.style.width = '380px';
      document.body.style.height = '500px';
      console.log('Applied fallback dimensions: 380 x 500');
      updateResizeUI();
    }
  };

  // Setup event listeners
  const setupEventListeners = () => {
    historyBtn.addEventListener('click', openDashboard);
    settingsBtn.addEventListener('click', openDashboard);
    overlayBtn.addEventListener('click', toggleOverlay);
    addCurrentSiteBtn.addEventListener('click', addCurrentSite);
    resizeToggle.addEventListener('click', toggleResizable);
    
    // Resize handle events
    resizeHandle.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    
    // Size preset button events
    document.querySelectorAll('.size-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const width = parseInt(btn.dataset.width);
        const height = parseInt(btn.dataset.height);
        setPopupSize(width, height);
        
        // Update active state
        document.querySelectorAll('.size-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  };



  // Toggle resizable functionality
  const toggleResizable = async () => {
    try {
      console.log('Toggling resizable, current state:', isResizable);
      isResizable = !isResizable;
      await storageService.setResizable(isResizable);
      updateResizeUI();
      console.log(`Resizable ${isResizable ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling resizable:', error);
      // Revert the change if there's an error
      isResizable = !isResizable;
      updateResizeUI();
    }
  };

  // Update resize UI
  const updateResizeUI = () => {
    console.log('Updating resize UI, isResizable:', isResizable);
    if (isResizable) {
      resizeHandle.style.display = 'block';
      sizePresets.style.display = 'flex';
      resizeToggle.classList.remove('disabled');
      resizeToggle.innerHTML = '↔';
      resizeToggle.title = 'Disable Resizable';
      console.log('Resize enabled - handle visible, toggle active');
    } else {
      resizeHandle.style.display = 'none';
      sizePresets.style.display = 'none';
      resizeToggle.classList.add('disabled');
      resizeToggle.innerHTML = '⊞';
      resizeToggle.title = 'Enable Resizable';
      console.log('Resize disabled - handle hidden, toggle inactive');
    }
  };

  // Start resize operation
  const startResize = (e) => {
    if (!isResizable) return;
    
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(document.body.style.width) || 380;
    startHeight = parseInt(document.body.style.height) || 500;
    
    showResizeStatus('Resizing...');
    e.preventDefault();
  };

  // Handle resize operation
  const handleResize = (e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    const newWidth = Math.max(300, startWidth + deltaX);
    const newHeight = Math.max(400, startHeight + deltaY);
    
    // Apply new dimensions
    document.body.style.width = `${newWidth}px`;
    document.body.style.height = `${newHeight}px`;
    
    // Also try to resize the popup window if possible
    try {
      if (window.resizeTo) {
        window.resizeTo(newWidth, newHeight);
      }
    } catch (e) {
      console.log('Could not resize popup window (Chrome extension limitation)');
    }
  };

  // Stop resize operation
  const stopResize = async () => {
    if (!isResizing) return;
    
    isResizing = false;
    
    // Save new dimensions
    const newWidth = parseInt(document.body.style.width);
    const newHeight = parseInt(document.body.style.height);
    
    if (newWidth && newHeight) {
      try {
        await storageService.updatePopupSize(newWidth, newHeight);
        showResizeStatus(`Size: ${newWidth} × ${newHeight}`);
      } catch (error) {
        console.error('Error saving popup dimensions:', error);
        showStatus('Failed to save popup size', 'error');
      }
    }
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
      const defaultSites = [
        'https://www.myntra.com',
        'https://www.ajio.com', 
        'https://www.flipkart.com',
        'https://www.amazon.in',
        'https://www.nykaa.com'
      ];
      
      if (userSites.some(site => site.url === currentUrl) || 
          defaultSites.includes(currentUrl)) {
        console.log('This site is already in your supported sites list');
        return;
      }
      
      // Add the new site
      const newSite = {
        url: currentUrl,
        name: siteName,
        icon: siteIcon
      };
      
      await storageService.addUserSite(newSite);
      console.log(`${siteName} added to supported sites!`);
      
      // Update the button text temporarily
      const originalText = addCurrentSiteBtn.innerHTML;
      addCurrentSiteBtn.innerHTML = '✅ Added!';
      addCurrentSiteBtn.disabled = true;
      
      setTimeout(() => {
        addCurrentSiteBtn.innerHTML = originalText;
        addCurrentSiteBtn.disabled = false;
      }, 2000);
      
    } catch (error) {
      console.error('Error adding current site:', error);
    }
  };







  // Set popup size
  const setPopupSize = async (width, height) => {
    document.body.style.width = `${width}px`;
    document.body.style.height = `${height}px`;
    
    try {
      await storageService.updatePopupSize(width, height);
      console.log(`Size set to ${width} × ${height}`);
      setActiveSizePreset(width, height);
    } catch (error) {
      console.error('Error saving popup size:', error);
    }
  };

  // Set active size preset button
  const setActiveSizePreset = (width, height) => {
    document.querySelectorAll('.size-preset-btn').forEach(btn => {
      const btnWidth = parseInt(btn.dataset.width);
      const btnHeight = parseInt(btn.dataset.height);
      
      if (btnWidth === width && btnHeight === height) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
