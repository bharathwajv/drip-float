// content/panel.js
(() => {
  // Create the root element to host the shadow DOM
  const root = document.createElement('div');
  root.id = 'drip-float-root';
  Object.assign(root.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 2147483647,
    width: '400px',
    height: '300px',
    transition: 'width 0.3s ease, height 0.3s ease',
  });
  const shadow = root.attachShadow({ mode: 'open' });

  // Link the external stylesheet
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('content/panel.css');
  shadow.appendChild(styleLink);

  // Main floating panel container
  const container = document.createElement('div');
  container.className = 'dy-container';
  container.innerHTML = `
    <div class="dy-header">
      <button class="dy-resize" aria-label="Resize"><img src="${chrome.runtime.getURL('public/icons/maximize-2.svg')}" alt="Expand" width="16" height="16"></button>
      <div class="dy-drag-handle" title="Drag to move"></div>
      <button class="dy-minimize" aria-label="Minimize"><img src="${chrome.runtime.getURL('public/icons/minimize-2.svg')}" alt="Minimize" width="16" height="16"></button>
      <button class="dy-close" aria-label="Close"><img src="${chrome.runtime.getURL('public/icons/circle-x.svg')}" alt="Close" width="16" height="16"></button>
    </div>
    <div class="dy-body">
      <div class="dy-image-slot" aria-label="Image view">
        <div class="dy-image-placeholder">
          <div class="dy-loading">🔄</div>
          <div class="dy-loading-text">Extracting images...</div>
        </div>
      </div>
      <div class="dy-side-buttons">
        <button class="dy-btn" data-action="extract" title="Open Full Screen"><img src="${chrome.runtime.getURL('public/icons/maximize-2.svg')}" alt="Open Full Screen" width="16" height="16"></button>
        <button class="dy-btn" data-action="generate" title="Download"><img src="${chrome.runtime.getURL('public/icons/download.svg')}" alt="Download" width="16" height="16"></button>
      </div>
    </div>
  `;

  // Minimized bubble container
  const minimizedBubble = document.createElement('div');
  minimizedBubble.className = 'dy-minimized-bubble dy-hidden';
  minimizedBubble.innerHTML = `
    <button class="dy-bubble-close" aria-label="Close"><img src="${chrome.runtime.getURL('public/icons/circle-x.svg')}" alt="Close" width="14" height="14"></button>
    <button class="dy-bubble-move" aria-label="Move"><img src="${chrome.runtime.getURL('public/icons/maximize-2.svg')}" alt="Move" width="14" height="14"></button>
    <div class="dy-bubble-content">
      <img src="${chrome.runtime.getURL('public/fav_icon_logo.png')}" alt="DripFloat" class="dy-bubble-logo" />
    </div>
  `;

  // Dismiss area indicator
  const dismissArea = document.createElement('div');
  dismissArea.className = 'dy-dismiss-area dy-hidden';
  dismissArea.innerHTML = `
    <div class="dy-dismiss-content">
      <div class="dy-dismiss-icon">🗑️</div>
      <div class="dy-dismiss-text">Drop to dismiss</div>
    </div>
  `;

  // "More options" bubble
  const moreBubble = document.createElement('button');
  moreBubble.className = 'dy-more-bubble';
  moreBubble.innerHTML = '⋯<br><span style="font-size: 10px; line-height: 1;">More</span>';
  moreBubble.title = 'More options';

  // Menu that appears when the "more" bubble is clicked
  const menu = document.createElement('div');
  menu.className = 'dy-menu dy-hidden';
  menu.innerHTML = `
    <button class="dy-menu-item" data-menu="history">History</button>
    <button class="dy-menu-item" data-menu="open-full">Open Full Page</button>
    <button class="dy-menu-item" data-menu="extract-images">Extract Images</button>
  `;

  // Append elements to the shadow DOM
  shadow.appendChild(container);
  shadow.appendChild(minimizedBubble);
  shadow.appendChild(dismissArea);
  shadow.appendChild(moreBubble);
  shadow.appendChild(menu);
  document.documentElement.appendChild(root);

  // Initialize image extractor
  let imageExtractor = null;
  let currentImages = [];
  let currentImageIndex = 0;
  let isMinimized = false;
  let isExpanded = false;
  let originalWidth = 0;
  let originalHeight = 0;
  let expandedWidth = 0;
  let expandedHeight = 0;
  let bubbleDragging = false;
  let bubbleStartX = 0, bubbleStartY = 0;
  let bubbleStartLeft = 0, bubbleStartTop = 0;
  let isOverDismissArea = false;
  let dragEndTime = 0;
  const CLICK_DELAY = 150; // 150ms delay to prevent accidental clicks after drag

  // Fallback function to get og:image from the page
  const getOGImageFromPage = () => {
    try {
      // Try to get og:image meta tag
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && ogImage.content) {
        return {
          url: ogImage.content,
          type: 'og:image',
          alt: 'Page Preview Image'
        };
      }
      
      // Try to get twitter:image as fallback
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (twitterImage && twitterImage.content) {
        return {
          url: twitterImage.content,
          type: 'twitter:image',
          alt: 'Page Preview Image'
        };
      }
      
      // Try to get any large image from the page
      const images = document.querySelectorAll('img');
      for (let img of images) {
        if (img.src && 
            img.src !== 'data:image/svg+xml;base64,' &&
            img.naturalWidth > 200 && 
            img.naturalHeight > 200 &&
            !img.src.includes('logo') &&
            !img.src.includes('icon')) {
          return {
            url: img.src,
            type: 'page-image',
            alt: img.alt || 'Page Image'
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting fallback image:', error);
      return null;
    }
  };

  // Initialize image extractor when DOM is ready
  const initImageExtractor = async () => {
    try {
      // Load the image extractor script
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('content/imageExtractor.js');
      script.onload = async () => {
        if (window.ImageExtractor) {
          imageExtractor = new window.ImageExtractor();
          await extractAndDisplayImages();
        }
      };
      script.onerror = () => {
        // If script fails to load, try fallback immediately
        console.log('Image extractor script failed to load, trying fallback...');
        const ogImage = getOGImageFromPage();
        if (ogImage) {
          currentImages = [ogImage];
          displayCurrentImage();
          showImageSuccess('Using page preview image (fallback)');
        } else {
          showImageError('Failed to load image extractor');
        }
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error initializing image extractor:', error);
      // Try fallback immediately
      const ogImage = getOGImageFromPage();
      if (ogImage) {
        currentImages = [ogImage];
        displayCurrentImage();
        showImageSuccess('Using page preview image (fallback)');
      } else {
        showImageError('Failed to initialize image extractor');
      }
    }
  };

  // Extract and display images
  const extractAndDisplayImages = async () => {
    if (!imageExtractor) return;

    // Set a timeout to fallback to og:image if extraction takes too long
    const extractionTimeout = setTimeout(() => {
      console.log('Image extraction timed out, using fallback...');
      const ogImage = getOGImageFromPage();
      if (ogImage) {
        currentImages = [ogImage];
        displayCurrentImage();
        showImageSuccess('Using page preview image (timeout fallback)');
      } else {
        showImageError('Image extraction timed out');
      }
    }, 3000); // 3 second timeout

    try {
      showImageLoading();
      
      const result = await imageExtractor.extractPageImages();
      clearTimeout(extractionTimeout); // Clear timeout if successful
      
      currentImages = result.allImages || [];
      
      if (currentImages.length > 0) {
        displayCurrentImage();
        showImageSuccess(`Found ${currentImages.length} images`);
      } else {
        // Fallback: try to get og:image from the page
        const ogImage = getOGImageFromPage();
        if (ogImage) {
          currentImages = [ogImage];
          displayCurrentImage();
          showImageSuccess('Using page preview image');
        } else {
          showImageError('No images found on this page');
        }
      }
    } catch (error) {
      clearTimeout(extractionTimeout);
      console.error('Error extracting images:', error);
      
      // Fallback: try to get og:image from the page
      const ogImage = getOGImageFromPage();
      if (ogImage) {
        currentImages = [ogImage];
        displayCurrentImage();
        showImageSuccess('Using page preview image (fallback)');
      } else {
        showImageError('Failed to extract images');
      }
    }
  };

  // Display current image
  const displayCurrentImage = () => {
    if (currentImages.length === 0) return;

    const imageSlot = container.querySelector('.dy-image-slot');
    const currentImage = currentImages[currentImageIndex];
    
    imageSlot.innerHTML = `
      <div class="dy-image-container">
        <img src="${currentImage.url}" alt="${currentImage.alt}" class="dy-extracted-image" />
        <div class="dy-image-info">
          <div class="dy-image-counter">${currentImageIndex + 1}/${currentImages.length}</div>
        </div>
        <div class="dy-image-nav">
          <button class="dy-nav-btn" data-action="prev" ${currentImageIndex === 0 ? 'disabled' : ''}>‹</button>
          <button class="dy-nav-btn" data-action="next" ${currentImageIndex === currentImages.length - 1 ? 'disabled' : ''}>›</button>
        </div>
      </div>
    `;

    // Add navigation event listeners
    const prevBtn = imageSlot.querySelector('[data-action="prev"]');
    const nextBtn = imageSlot.querySelector('[data-action="next"]');
    
    if (prevBtn) prevBtn.addEventListener('click', showPreviousImage);
    if (nextBtn) nextBtn.addEventListener('click', showNextImage);
    
    // Update download button state
    updateDownloadButtonState();
  };

  // Navigation functions
  const showPreviousImage = () => {
    if (currentImageIndex > 0) {
      currentImageIndex--;
      displayCurrentImage();
    }
  };

  const showNextImage = () => {
    if (currentImageIndex < currentImages.length - 1) {
      currentImageIndex++;
      displayCurrentImage();
    }
  };

  // UI state functions
  const showImageLoading = () => {
    const imageSlot = container.querySelector('.dy-image-slot');
    imageSlot.innerHTML = `
      <div class="dy-image-placeholder">
        <div class="dy-loading">🔄</div>
        <div class="dy-loading-text">Extracting images...</div>
      </div>
    `;
  };

  const showImageSuccess = (message) => {
    const imageSlot = container.querySelector('.dy-image-slot');
    const successDiv = document.createElement('div');
    successDiv.className = 'dy-success-message';
    successDiv.textContent = message;
    imageSlot.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.remove();
      }
    }, 3000);
  };

  const showImageError = (message) => {
    const imageSlot = container.querySelector('.dy-image-slot');
    imageSlot.innerHTML = `
      <div class="dy-image-placeholder">
        <div class="dy-error">❌</div>
        <div class="dy-error-text">${message}</div>
      </div>
    `;
  };

  // Download current image
  const downloadCurrentImage = () => {
    if (currentImages.length === 0 || !currentImages[currentImageIndex]) {
      showImageError('No image to download');
      return;
    }

    const currentImage = currentImages[currentImageIndex];
    
    try {
      // Create a temporary link element for download
      const link = document.createElement('a');
      link.href = currentImage.url;
      link.download = `dripfloat-image-${Date.now()}.jpg`;
      link.target = '_blank';
      
      // Append to document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showImageSuccess('Download started!');
    } catch (error) {
      console.error('Error downloading image:', error);
      showImageError('Download failed');
    }
  };

  // Update download button state
  const updateDownloadButtonState = () => {
    const downloadBtn = container.querySelector('[data-action="generate"]');
    if (downloadBtn) {
      if (currentImages.length > 0) {
        downloadBtn.disabled = false;
        downloadBtn.classList.remove('dy-btn-disabled');
        downloadBtn.title = 'Download';
      } else {
        downloadBtn.disabled = true;
        downloadBtn.classList.add('dy-btn-disabled');
        downloadBtn.title = 'No images to download';
      }
    }
  };

  // Load saved dimensions from storage
  const loadSavedDimensions = () => {
    chrome.storage.local.get(['panelWidth', 'panelHeight'], (result) => {
      if (result.panelWidth && result.panelHeight) {
        originalWidth = result.panelWidth;
        originalHeight = result.panelHeight;
        root.style.width = `${originalWidth}px`;
        root.style.height = `${originalHeight}px`;
      } else {
        // Set default dimensions if none saved
        originalWidth = 400;
        originalHeight = 300;
        root.style.width = `${originalWidth}px`;
        root.style.height = `${originalHeight}px`;
      }
    });
  };

  // Save dimensions to storage
  const saveDimensions = () => {
    chrome.storage.local.set({ 
      panelWidth: originalWidth, 
      panelHeight: originalHeight 
    });
  };

  // Two-mode resize functionality
  const toggleResize = () => {
    if (isExpanded) {
      // Collapse to original size
      collapsePanel();
    } else {
      // Expand to 1/4 of browser size
      expandPanel();
    }
  };

  const expandPanel = () => {
    // Calculate 1/2 of browser size for expanded state
    expandedWidth = Math.floor(window.innerWidth * 0.5);
    expandedHeight = Math.floor(window.innerHeight * 0.5);
    
    // Ensure minimum size
    expandedWidth = Math.max(600, expandedWidth);
    expandedHeight = Math.max(450, expandedHeight);
    
    console.log('Expanding panel to:', expandedWidth, 'x', expandedHeight);
    
    // Animate expansion - update both root and container
    root.style.transition = 'width 0.3s ease, height 0.3s ease';
    container.style.transition = 'width 0.3s ease, height 0.3s ease';
    
    root.style.width = `${expandedWidth}px`;
    root.style.height = `${expandedHeight}px`;
    
    // Also update container dimensions to match
    container.style.width = '100%';
    container.style.height = '100%';
    
    isExpanded = true;
    
    // Update resize button icon
    const resizeBtn = container.querySelector('.dy-resize');
    resizeBtn.innerHTML = '<img src="' + chrome.runtime.getURL('public/icons/list-collapse.svg') + '" alt="Collapse" width="16" height="16">';
    resizeBtn.title = 'Collapse';
    
    // Remove transition after animation
    setTimeout(() => {
      root.style.transition = '';
      container.style.transition = '';
      console.log('Panel expanded, final size:', root.style.width, 'x', root.style.height);
    }, 300);
  };

  const collapsePanel = () => {
    console.log('Collapsing panel to:', originalWidth, 'x', originalHeight);
    
    // Animate collapse - update both root and container
    root.style.transition = 'width 0.3s ease, height 0.3s ease';
    container.style.transition = 'width 0.3s ease, height 0.3s ease';
    
    root.style.width = `${originalWidth}px`;
    root.style.height = `${originalHeight}px`;
    
    // Reset container dimensions to original
    container.style.width = '100%';
    container.style.height = '100%';
    
    isExpanded = false;
    
    // Update resize button icon
    const resizeBtn = container.querySelector('.dy-resize');
    resizeBtn.innerHTML = '<img src="' + chrome.runtime.getURL('public/icons/maximize-2.svg') + '" alt="Expand" width="16" height="16">';
    resizeBtn.title = 'Expand';
    
    // Remove transition after animation
    setTimeout(() => {
      root.style.transition = '';
      container.style.transition = '';
      console.log('Panel collapsed, final size:', root.style.width, 'x', root.style.height);
    }, 300);
  };

  // Minimize functionality
  const minimizePanel = () => {
    isMinimized = true;
    container.classList.add('dy-hidden');
    moreBubble.classList.add('dy-hidden');
    menu.classList.add('dy-hidden');
    minimizedBubble.classList.remove('dy-hidden');
    
    // Load saved bubble position or use default
    loadBubblePosition();
    
    // Store minimized state
    chrome.storage.local.set({ panelMinimized: true });
  };

  const restorePanel = () => {
    isMinimized = false;
    container.classList.remove('dy-hidden');
    moreBubble.classList.remove('dy-hidden');
    minimizedBubble.classList.add('dy-hidden');
    
    // Store restored state
    chrome.storage.local.set({ panelMinimized: false });
  };

  // Load saved minimized state
  const loadSavedState = () => {
    chrome.storage.local.get(['panelMinimized'], (result) => {
      if (result.panelMinimized) {
        minimizePanel();
      }
    });
  };

  // --- Enhanced Drag Functionality - Entire container draggable except specific areas ---
  let dragging = false;
  let startX = 0, startY = 0;
  let startLeft = 0, startTop = 0;

  const startDrag = (e) => {
    // Check if clicking on non-draggable elements
    const target = e.target;
    if (target.closest('.dy-close') || 
        target.closest('.dy-btn') || 
        target.closest('.dy-image-slot') ||
        target.closest('.dy-nav-btn') ||
        target.closest('.dy-more-bubble') ||
        target.closest('.dy-menu') ||
        target.closest('.dy-menu-item') ||
        target.closest('.dy-resize') ||
        target.closest('.dy-minimize')) {
      return;
    }

    dragging = true;
    const rect = root.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    
    // Disable snapping and add dragging class
    root.style.right = 'auto';
    root.style.bottom = 'auto';
    container.classList.add('dragging');
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    
    // Prevent text selection during drag
    e.preventDefault();
  };

  const onDrag = (e) => {
    if (!dragging) return;
    
    // Calculate new position
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    // Apply new position directly without smooth animations
    root.style.left = `${startLeft + dx}px`;
    root.style.top = `${startTop + dy}px`;
  };

  const endDrag = () => {
    if (!dragging) return;
    
    dragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    
    // Remove dragging class
    container.classList.remove('dragging');
  };

  // Make entire container draggable
  container.addEventListener('mousedown', startDrag);
  
  // Add touch support for mobile
  container.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    startDrag({
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => {},
      target: e.target
    });
  });

  // Minimized bubble drag functionality
  const startBubbleDrag = (e) => {
    // Only start dragging if clicking the move button
    if (!e.target.closest('.dy-bubble-move')) {
      return;
    }
    
    // Don't start dragging immediately, wait for movement
    const rect = minimizedBubble.getBoundingClientRect();
    bubbleStartX = e.clientX;
    bubbleStartY = e.clientY;
    bubbleStartLeft = rect.left;
    bubbleStartTop = rect.top;
    
    // Add a small threshold to distinguish between clicks and drags
    const dragThreshold = 5; // 5px movement threshold
    
    const checkForDrag = (moveEvent) => {
      const dx = Math.abs(moveEvent.clientX - bubbleStartX);
      const dy = Math.abs(moveEvent.clientY - bubbleStartY);
      
      if (dx > dragThreshold || dy > dragThreshold) {
        // Start actual dragging
        bubbleDragging = true;
        minimizedBubble.classList.add('dragging');
        
        // Show dismiss area
        dismissArea.classList.remove('dy-hidden');
        
        document.addEventListener('mousemove', onBubbleDrag);
        document.addEventListener('mouseup', endBubbleDrag);
        
        // Remove the mousemove listener that was checking for drag threshold
        document.removeEventListener('mousemove', checkForDrag);
        document.removeEventListener('mouseup', checkForDrag);
      }
    };
    
    document.addEventListener('mousemove', checkForDrag);
    document.addEventListener('mouseup', (e) => {
      checkForDrag(e);
      handleMouseUp();
    });
  };

  const onBubbleDrag = (e) => {
    if (!bubbleDragging) return;
    
    const dx = e.clientX - bubbleStartX;
    const dy = e.clientY - bubbleStartY;
    
    // Calculate new position
    const newLeft = bubbleStartLeft + dx;
    const newTop = bubbleStartTop + dy;
    
    // Apply new position
    minimizedBubble.style.left = `${newLeft}px`;
    minimizedBubble.style.top = `${newTop}px`;
    minimizedBubble.style.right = 'auto';
    minimizedBubble.style.bottom = 'auto';
    
    // Check if bubble is over dismiss area
    const bubbleRect = minimizedBubble.getBoundingClientRect();
    const dismissRect = dismissArea.getBoundingClientRect();
    
    const isOver = !(bubbleRect.right < dismissRect.left || 
                     bubbleRect.left > dismissRect.right || 
                     bubbleRect.bottom < dismissRect.top || 
                     bubbleRect.top > dismissRect.bottom);
    
    if (isOver !== isOverDismissArea) {
      isOverDismissArea = isOver;
      if (isOver) {
        dismissArea.classList.add('dy-dismiss-active');
        minimizedBubble.classList.add('dy-over-dismiss');
      } else {
        dismissArea.classList.remove('dy-dismiss-active');
        minimizedBubble.classList.remove('dy-over-dismiss');
      }
    }
  };

  const endBubbleDrag = () => {
    if (!bubbleDragging) return;
    
    bubbleDragging = false;
    minimizedBubble.classList.remove('dragging');
    minimizedBubble.classList.remove('dy-over-dismiss');
    document.removeEventListener('mousemove', onBubbleDrag);
    document.removeEventListener('mouseup', endBubbleDrag);
    
    // Set drag end time to prevent immediate clicks
    dragEndTime = Date.now();
    
    // Hide dismiss area
    dismissArea.classList.add('dy-hidden');
    dismissArea.classList.remove('dy-dismiss-active');
    
    // Check if bubble was dropped over dismiss area
    if (isOverDismissArea) {
      // Dismiss the bubble (hide it completely)
      root.style.display = 'none';
      chrome.storage.local.set({ overlayVisible: false });
      return;
    }
    
    // Save bubble position if not dismissed
    saveBubblePosition();
  };

  // Handle mouse up when drag threshold wasn't met (click case)
  const handleMouseUp = () => {
    // If we didn't start dragging, this was just a click
    if (!bubbleDragging) {
      // Reset drag end time for click handling
      dragEndTime = Date.now();
    }
  };

  const saveBubblePosition = () => {
    const rect = minimizedBubble.getBoundingClientRect();
    const position = {
      bubbleLeft: rect.left,
      bubbleTop: rect.top
    };
    console.log('Saving bubble position:', position);
    chrome.storage.local.set(position);
  };

  const loadBubblePosition = () => {
    chrome.storage.local.get(['bubbleLeft', 'bubbleTop'], (result) => {
      if (result.bubbleLeft !== undefined && result.bubbleTop !== undefined) {
        console.log('Loading bubble position:', result);
        minimizedBubble.style.left = `${result.bubbleLeft}px`;
        minimizedBubble.style.top = `${result.bubbleTop}px`;
        minimizedBubble.style.right = 'auto';
        minimizedBubble.style.bottom = 'auto';
      } else {
        console.log('No saved bubble position found, using default');
        // Set default position if none saved
        minimizedBubble.style.left = 'auto';
        minimizedBubble.style.top = 'auto';
        minimizedBubble.style.right = '24px';
        minimizedBubble.style.bottom = '24px';
      }
    });
  };

  // --- UI Event Listeners ---
  container.querySelector('.dy-close').addEventListener('click', () => {
    root.style.display = 'none';
    // Update storage to reflect hidden state
    chrome.storage.local.set({ overlayVisible: false });
  });

  // Resize button event listener
  container.querySelector('.dy-resize').addEventListener('click', toggleResize);

  // Minimize button event listener
  container.querySelector('.dy-minimize').addEventListener('click', minimizePanel);



  // Minimized bubble close button
  minimizedBubble.querySelector('.dy-bubble-close').addEventListener('click', () => {
    root.style.display = 'none';
    chrome.storage.local.set({ overlayVisible: false });
  });

  // Minimized bubble click to restore
  minimizedBubble.addEventListener('click', (e) => {
    console.log('Minimized bubble clicked');
    
    // Only restore if clicking the content area (not buttons) and no drag occurred
    if (e.target.closest('.dy-bubble-content') && !bubbleDragging) {
      console.log('Restoring panel...');
      restorePanel();
    }
  });



  // Minimized bubble drag event listeners - only on move button
  minimizedBubble.querySelector('.dy-bubble-move').addEventListener('mousedown', startBubbleDrag);
  minimizedBubble.querySelector('.dy-bubble-move').addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    startBubbleDrag({
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => {},
      target: e.target
    });
  });



  // Side button actions
  container.addEventListener('click', (e) => {
    const action = e.target.closest('.dy-btn')?.dataset.action;
    if (action === 'extract') {
      // Open full screen
      chrome.runtime.sendMessage({ type: 'OPEN_HISTORY_TAB' });
    } else if (action === 'generate') {
      // Download functionality
      if (currentImages.length > 0 && currentImages[currentImageIndex]) {
        downloadCurrentImage();
      } else {
        showImageError('No image to download');
      }
    }
  });

  moreBubble.addEventListener('click', () => {
    menu.classList.toggle('dy-hidden');
  });

  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.dy-menu-item');
    if (!item) return;
    
    const menuAction = item.dataset.menu;
    if (menuAction === 'history' || menuAction === 'open-full') {
      chrome.runtime.sendMessage({ type: 'OPEN_HISTORY_TAB' });
    } else if (menuAction === 'extract-images') {
      extractAndDisplayImages();
    }
    
    menu.classList.add('dy-hidden'); // Hide menu after click
  });
  
  // Function to show/hide overlay
  const toggleOverlay = (visible) => {
    if (visible) {
      root.style.display = 'block';
    } else {
      root.style.display = 'none';
    }
  };

  // Listen for messages from popup or service worker
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_OVERLAY') {
      toggleOverlay(message.visible);
      sendResponse({ ok: true });
    }
  });
  
  // Check options to decide if the overlay should be shown by default
  chrome.runtime.sendMessage({ type: 'GET_OVERLAY_STATE' }, async (res) => {
    if (res?.ok) {
      // Check if current site is supported before showing overlay
      const isSiteSupported = await checkIfSiteSupported();
      if (isSiteSupported) {
        toggleOverlay(res.visible);
      } else {
        console.log('Current site is not supported, overlay will not be shown');
      }
    }
  });

  // Check if current site is supported
  const checkIfSiteSupported = async () => {
    try {
      const currentUrl = window.location.href;
      const hostname = window.location.hostname;
      
      // Try to load default sites from centralized config
      let defaultSites = [];
      try {
        const { DEFAULT_SITES } = await import(chrome.runtime.getURL('config/sites.js'));
        defaultSites = DEFAULT_SITES.map(site => {
          const url = new URL(site.url);
          return url.hostname.replace('www.', '');
        });
      } catch (importError) {
        console.error('Error importing sites config:', importError);
        // Fallback to basic sites
        defaultSites = [
          'myntra.com',
          'ajio.com',
          'flipkart.com',
          'amazon.in',
          'nykaa.com'
        ];
      }
      
      // Check if current hostname is in default sites
      if (defaultSites.some(site => hostname.includes(site))) {
        return true;
      }
      
      // Check user-added sites
      return new Promise((resolve) => {
        chrome.storage.local.get(['userSites'], (result) => {
          const userSites = result.userSites || [];
          const isSupported = userSites.some(site => {
            try {
              const siteHostname = new URL(site.url).hostname;
              return hostname === siteHostname || hostname.includes(siteHostname);
            } catch (e) {
              return false;
            }
          });
          resolve(isSupported);
        });
      });
      
    } catch (error) {
      console.error('Error checking site support:', error);
      return false;
    }
  };

  // Load saved dimensions and state
  loadSavedDimensions();
  loadSavedState();
  loadBubblePosition();
  
  // Initialize original dimensions
  originalWidth = parseInt(root.style.width) || 400;
  originalHeight = parseInt(root.style.height) || 300;

  // Initialize image extractor when page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageExtractor);
  } else {
    initImageExtractor();
  }
  
  // Initialize download button state
  updateDownloadButtonState();
  
  // Save bubble position before page unload
  window.addEventListener('beforeunload', () => {
    if (isMinimized && minimizedBubble.style.display !== 'none') {
      saveBubblePosition();
    }
  });
})();
