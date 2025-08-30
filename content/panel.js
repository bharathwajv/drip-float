// content/panel.js
(() => {
  // Initialize the overlay
  const init = () => {
    console.log('Drip Float: Starting initialization...');
    createOverlay();
  };

  // Create the overlay
  const createOverlay = () => {
    // Create the root element to host the shadow DOM
    const root = document.createElement('div');
    root.id = 'drip-float-root';
    Object.assign(root.style, {
      position: 'fixed',
      bottom: '40px',
      right: '100px',
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
        <button class="dy-resize" aria-label="Resize"><img src="${chrome.runtime.getURL('icons/maximize-2.svg')}" alt="Expand" width="16" height="16" onerror="this.style.display='none'; this.nextSibling.style.display='inline';"><span style="display:none;">⤡</span></button>
        <div class="dy-drag-handle" title="Drag to move"></div>
        <button class="dy-minimize" aria-label="Minimize"><img src="${chrome.runtime.getURL('icons/minus.svg')}" alt="Minimize" width="18" height="18" onerror="this.style.display='none'; this.nextSibling.style.display='inline';"><span style="display:none;">−</span></button>
        <button class="dy-close" aria-label="Close"><img src="${chrome.runtime.getURL('icons/x.svg')}" alt="Close" width="18" height="18" onerror="this.style.display='none'; this.nextSibling.style.display='inline';"><span style="display:none;">✕</span></button>
      </div>
      <div class="dy-body">
        <div class="dy-image-slot" aria-label="Image view">
          <div class="dy-image-placeholder">
            <div class="dy-try-button-container">
              <button class="dy-btn dy-btn-primary dy-try-btn" data-action="try-this-out">
                Try it on
              </button>
              <div class="dy-try-subtext">Generate personalized AI images from this page</div>
            </div>
          </div>
        </div>
        <div class="dy-side-buttons">
          <button class="dy-btn" data-action="more" title="More Options"><img src="${chrome.runtime.getURL('icons/text-align-justify.svg')}" alt="More Options" width="16" height="16" onerror="this.style.display='none'; this.nextSibling.style.display='inline';"><span style="display:none;">⋯</span></button>
          <button class="dy-btn" data-action="extract" title="Open Full Screen"><img src="${chrome.runtime.getURL('icons/square-arrow-out-up-right.svg')}" alt="Open Full Screen" width="16" height="16" onerror="this.style.display='none'; this.nextSibling.style.display='inline';"><span style="display:none;">↗</span></button>
          <button class="dy-btn" data-action="download-generated" title="Download Image"><img src="${chrome.runtime.getURL('icons/download.svg')}" alt="Download Image" width="16" height="16" onerror="this.style.display='none'; this.nextSibling.style.display='inline';"><span style="display:none;">🎨</span></button>
        </div>
      </div>
    `;

    // Minimized bubble container
    const minimizedBubble = document.createElement('div');
    minimizedBubble.className = 'dy-minimized-bubble dy-hidden';
    minimizedBubble.innerHTML = `
      <button class="dy-bubble-close" aria-label="Close"><img src="${chrome.runtime.getURL('icons/circle-x.svg')}" alt="Close" width="18" height="18" onerror="this.style.display='none'; this.nextSibling.style.display='inline';"><span style="display:none;">✕</span></button>
      <div class="dy-bubble-content">
        <img src="${chrome.runtime.getURL('public/fav_icon_logo.png')}" alt="DripFloat" class="dy-bubble-logo" />
      </div>
    `;

    // Append elements to the shadow DOM
    shadow.appendChild(container);
    shadow.appendChild(minimizedBubble);
    
    // Add dropdown menu for more options
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dy-dropdown-menu dy-hidden';
    dropdownMenu.innerHTML = `
      <button class="dy-dropdown-item" data-menu="history">History</button>
      <button class="dy-dropdown-item" data-menu="open-full">Open Full Page</button>
      <button class="dy-dropdown-item" data-menu="open-settings">Open Settings</button>
    `;
    
    // Add CSS styling for the dropdown menu
    const dropdownStyle = document.createElement('style');
    dropdownStyle.textContent = `
      .dy-dropdown-menu {
        position: absolute;
        background: white;
        top: 30%;
        right: 0;
        left: 100%;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 8px 0;
        min-width: 160px;
        z-index: 1000;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .dy-dropdown-menu.dy-hidden {
        display: none;
      }
      
      .dy-dropdown-item {
        display: block;
        width: 100%;
        padding: 8px 16px;
        border: none;
        background: none;
        text-align: left;
        font-size: 14px;
        font-weight: 500;
        color: #495057;
        cursor: pointer;
        transition: background-color 0.2s ease;
        font-family: inherit;
      }
      
      .dy-dropdown-item:hover {
        background-color: #f8f9fa;
        color: #007bff;
      }
      
      .dy-dropdown-item:active {
        background-color: #e9ecef;
      }
    `;
    
    shadow.appendChild(dropdownStyle);
    shadow.appendChild(dropdownMenu);
    
    document.documentElement.appendChild(root);
    
    // Initialize all the functionality after creating the overlay
    initializeOverlayFunctionality(root, shadow, container, minimizedBubble, dropdownMenu);
  };

  // Initialize all overlay functionality
  const initializeOverlayFunctionality = (root, shadow, container, minimizedBubble, dropdownMenu) => {
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
      console.log('Initializing image extractor...');
      
      // Load the image extractor script content directly
      const response = await fetch(chrome.runtime.getURL('content/imageExtractor.js'));
      const scriptContent = await response.text();
      
      // Create a script element and inject the content
      const script = document.createElement('script');
      script.textContent = scriptContent;
      
      // Inject the script into the page context
      (document.head || document.documentElement).appendChild(script);
      
      // Wait a bit for the script to execute
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Image extractor script loaded...');
      
      // Check if ImageExtractor is now available
      if (window.ImageExtractor) {
        console.log('Image extractor instance created...');
        imageExtractor = new window.ImageExtractor();
        // Don't extract images automatically, show the try button instead
        showTryThisOutButton();
      } else {
        console.log('ImageExtractor not found in window, showing try button...');
        showTryThisOutButton();
      }
    } catch (error) {
      console.error('Error initializing image extractor:', error);
      showTryThisOutButton();
    }
  };

  // Extract and display images
  const extractAndDisplayImages = async () => {
    if (!imageExtractor) return;

    console.log('Extracting and displaying images...');
    // Set a timeout to fallback to og:image if extraction takes too long
    const extractionTimeout = setTimeout(() => {
      console.log('Image extraction timed out, using fallback...');
      const ogImage = getOGImageFromPage();
      if (ogImage) {
        currentImages = [ogImage];
        displayCurrentImage();
        showImageSuccess('Using page preview image (timeout fallback)');
        updateNavigationState();
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
        
        // Store metadata for image generation
        if (result.metadata) {
          window.currentPageMetadata = result.metadata;
        }
        
        // Ensure navigation state is updated after images are loaded
        setTimeout(() => forceUpdateNavigationState(), 100);
      } else {
        // Fallback: try to get og:image from the page
        const ogImage = getOGImageFromPage();
        if (ogImage) {
          currentImages = [ogImage];
          displayCurrentImage();
          showImageSuccess('Using page preview image');
          updateNavigationState();
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
        updateNavigationState();
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
          <button class="dy-nav-btn" data-action="prev" ${currentImageIndex === 0 ? 'disabled' : ''}>
            <img src="${chrome.runtime.getURL('icons/circle-chevron-left.svg')}" alt="Previous" width="24" height="24" onerror="this.style.display='none'; this.nextSibling.style.display='inline';">
            <span style="display:none;">‹</span>
          </button>
          <button class="dy-nav-btn" data-action="next" ${currentImageIndex === currentImages.length - 1 ? 'disabled' : ''}>
            <img src="${chrome.runtime.getURL('icons/circle-chevron-right.svg')}" alt="Next" width="24" height="24" onerror="this.style.display='none'; this.nextSibling.style.display='inline';">
            <span style="display:none;">›</span>
          </button>
        </div>
      </div>
    `;

    // Add navigation event listeners
    const prevBtn = imageSlot.querySelector('[data-action="prev"]');
    const nextBtn = imageSlot.querySelector('[data-action="next"]');
    
    if (prevBtn) prevBtn.addEventListener('click', showPreviousImage);
    if (nextBtn) nextBtn.addEventListener('click', showNextImage);
    
    // Update navigation state based on current panel state
    updateNavigationState();
    
    // Update download button state
    updateDownloadButtonState();
  };

  // Show try this out button
  const showTryThisOutButton = () => {
    const imageSlot = container.querySelector('.dy-image-slot');
    imageSlot.innerHTML = `
      <div class="dy-image-placeholder">
        <div class="dy-try-button-container">
          <button class="dy-btn dy-btn-primary dy-try-btn" data-action="try-this-out">
            Try it on
          </button>
          <div class="dy-try-subtext">Generate personalized AI images from this outfit</div>
        </div>
      </div>
    `;

    // Add event listener for the try button
    const tryBtn = imageSlot.querySelector('[data-action="try-this-out"]');
    if (tryBtn) {
      tryBtn.addEventListener('click', handleTryThisOut);
    }
    
    // Update download button state since there are no images initially
    updateDownloadButtonState();
  };

  // Handle try this out button click
  const handleTryThisOut = async () => {
    try {
      // Show loading state
      showImageLoading();
      
      // First extract images from the page
      if (imageExtractor) {
        const result = await imageExtractor.extractPageImages();
        currentImages = result.allImages || [];
        
        if (currentImages.length > 0) {
          // Store metadata for image generation
          if (result.metadata) {
            window.currentPageMetadata = result.metadata;
          }
          
          // Now generate personalized image
          await generatePersonalizedImage();
          
          // Update navigation state
          updateNavigationState();
          
          // Update download button state since we now have images
          updateDownloadButtonState();
        } else {
          // Fallback: try to get og:image from the page
          const ogImage = getOGImageFromPage();
          if (ogImage) {
            currentImages = [ogImage];
            await generatePersonalizedImage();
            updateNavigationState();
            updateDownloadButtonState();
          } else {
            showImageError('No images found on this page');
          }
        }
      } else {
        // Fallback: try to get og:image from the page
        const ogImage = getOGImageFromPage();
        if (ogImage) {
          currentImages = [ogImage];
          await generatePersonalizedImage();
          updateNavigationState();
          updateDownloadButtonState();
        } else {
          showImageError('Failed to extract images');
        }
      }
    } catch (error) {
      console.error('Error in handleTryThisOut:', error);
      showImageError('Failed to process page images');
    }
  };

  // Generate personalized image using AI
  const generatePersonalizedImage = async () => {
    if (currentImages.length === 0 || !currentImages[currentImageIndex]) {
      showImageError('No image to process');
      return;
    }

    const currentImage = currentImages[currentImageIndex];
    
    try {
      // Show generating spinner
      showImageGenerating();
      
      // Load the image generation script content directly
      try {
        const response = await fetch(chrome.runtime.getURL('AI/imagegen.js'));
        const scriptContent = await response.text();
        
        // Create a script element and inject the content
        const script = document.createElement('script');
        script.textContent = scriptContent;
        
        // Inject the script into the page context
        (document.head || document.documentElement).appendChild(script);
        
        // Wait a bit for the script to execute
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get product description from metadata
        let productDescription = 'Product';
        if (window.currentPageMetadata && window.currentPageMetadata.ogDescription) {
          productDescription = window.currentPageMetadata.ogDescription;
        } else if (window.currentPageMetadata && window.currentPageMetadata.description) {
          productDescription = window.currentPageMetadata.description;
        } else if (window.currentPageMetadata && window.currentPageMetadata.productName) {
          productDescription = window.currentPageMetadata.productName;
        }

        // Check if ImageGen is now available
        if (window.ImageGen) {
          // Call the image generation function
          const result = await window.ImageGen.generatePersonalizedImage(
            currentImage.url,
            productDescription
          );

          if (result.success && result.imageData) {
            // Display the generated image
            displayGeneratedImage(result.imageData);
            showImageSuccess('AI-generated image ready!');
          } else {
            showImageError(`Generation failed: ${result.error || 'Unknown error'}`);
          }
        } else {
          showImageError('Image generation module not loaded');
        }
      } catch (error) {
        console.error('Error loading image generation script:', error);
        showImageError('Failed to load image generation module');
      }
      
    } catch (error) {
      console.error('Error starting image generation:', error);
      showImageError('Failed to start image generation');
    }
  };

  // Set up the try button event listener since it's already in the HTML
  const tryBtn = container.querySelector('[data-action="try-this-out"]');
  if (tryBtn) {
    tryBtn.addEventListener('click', handleTryThisOut);
  }

  // Display generated AI image
  const displayGeneratedImage = (imageData) => {
    const imageSlot = container.querySelector('.dy-image-slot');
    
    // Create blob URL from base64 data
    const blobUrl = window.ImageGen.base64ToBlobUrl(imageData.data, imageData.mimeType);
    
    if (blobUrl) {
      imageSlot.innerHTML = `
        <div class="dy-image-container">
          <img src="${blobUrl}" alt="AI Generated Image" class="dy-extracted-image dy-generated-image" />
          <div class="dy-image-info">
            <div class="dy-image-label">AI Generated</div>
          </div>
          <div class="dy-image-actions">
            <button class="dy-btn dy-btn-primary" data-action="download-generated">Download</button>
            <button class="dy-btn" data-action="back-to-original">Back to Original</button>
          </div>
        </div>
      `;

      // Add event listeners for generated image actions
      const downloadBtn = imageSlot.querySelector('[data-action="download-generated"]');
      const backBtn = imageSlot.querySelector('[data-action="back-to-original"]');
      
      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
          window.ImageGen.saveImageToFile(imageData.data, 'ai-generated-image.png', imageData.mimeType);
        });
      }
      
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          displayCurrentImage();
        });
      }
    } else {
      showImageError('Failed to display generated image');
    }
  };

  // Show image generating spinner
  const showImageGenerating = () => {
    const imageSlot = container.querySelector('.dy-image-slot');
    imageSlot.innerHTML = `
      <div class="dy-image-placeholder">
        <div class="dy-loading dy-generating">🎨</div>
        <div class="dy-loading-text">Generating AI image...</div>
        <div class="dy-loading-subtext">This may take a few moments</div>
      </div>
    `;
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
        <div class="dy-error-text">Something went wrong</div>
        <button class="dy-btn dy-btn-primary dy-retry-btn" data-action="retry">
          Try Again
        </button>
      </div>
    `;

    // Add event listener for retry button
    const retryBtn = imageSlot.querySelector('[data-action="retry"]');
    if (retryBtn) {
      retryBtn.addEventListener('click', handleTryThisOut);
    }
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
        downloadBtn.title = 'Generate AI Image';
      } else {
        downloadBtn.disabled = true;
        downloadBtn.classList.add('dy-btn-disabled');
        downloadBtn.title = 'No images to process';
      }
    }
  };

  // Update navigation state based on panel expansion
  const updateNavigationState = () => {
    const imageNav = container.querySelector('.dy-image-nav');
    if (imageNav && currentImages.length > 1) {
      // Always show navigation when there are multiple images
      imageNav.classList.add('dy-multiple-images');
      
      if (isExpanded) {
        imageNav.classList.add('dy-expanded');
      } else {
        imageNav.classList.remove('dy-expanded', 'dy-expanding', 'dy-collapsing');
      }
    } else if (imageNav) {
      // Hide navigation when there's only one image
      imageNav.classList.remove('dy-multiple-images', 'dy-expanded', 'dy-expanding', 'dy-collapsing');
    }
  };
  
  // Force update navigation state - call this when panel state changes
  const forceUpdateNavigationState = () => {
    if (currentImages.length > 1) {
      updateNavigationState();
    }
  };

  // Dropdown menu functionality
  const toggleDropdownMenu = () => {
    const dropdown = shadow.querySelector('.dy-dropdown-menu');
    dropdown.classList.toggle('dy-hidden');

  };

  // Handle dropdown menu item clicks
  shadow.addEventListener('click', (e) => {
    const menuItem = e.target.closest('.dy-dropdown-item');
    if (!menuItem) return;
    
    const menuAction = menuItem.dataset.menu;
    if (menuAction === 'history' || menuAction === 'open-full') {
      chrome.runtime.sendMessage({ type: 'OPEN_HISTORY_TAB' });
    }
    
    // Hide dropdown after selection
    const dropdown = shadow.querySelector('.dy-dropdown-menu');
    dropdown.classList.add('dy-hidden');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) {
      const dropdown = shadow.querySelector('.dy-dropdown-menu');
      if (dropdown && !dropdown.classList.contains('dy-hidden')) {
        dropdown.classList.add('dy-hidden');
      }
    }
  });

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
    resizeBtn.innerHTML = '<img src="' + chrome.runtime.getURL('icons/minimize-2.svg') + '" alt="Collapse" width="16" height="16" onerror="this.style.display=\'none\'; this.nextSibling.style.display=\'inline\';"><span style="display:none;">⤢</span>';
    resizeBtn.title = 'Collapse';
    
    // Update navigation buttons to expanded state
    const imageNav = container.querySelector('.dy-image-nav');
    if (imageNav && currentImages.length > 1) {
      imageNav.classList.add('dy-multiple-images', 'dy-expanded');
    }
    
    // Remove transition after animation
    setTimeout(() => {
      root.style.transition = '';
      container.style.transition = '';
      console.log('Panel expanded, final size:', root.style.width, 'x', root.style.height);
      
      // If no images are loaded, show the try button
      if (currentImages.length === 0) {
        showTryThisOutButton();
      }
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
    resizeBtn.innerHTML = '<img src="' + chrome.runtime.getURL('icons/maximize-2.svg') + '" alt="Expand" width="16" height="16" onerror="this.style.display=\'none\'; this.nextSibling.style.display=\'inline\';"><span style="display:none;">⤡</span>';
    resizeBtn.title = 'Expand';
    
    // Update navigation buttons to collapsed state
    const imageNav = container.querySelector('.dy-image-nav');
    if (imageNav && currentImages.length > 1) {
      imageNav.classList.remove('dy-expanded');
      // Keep dy-multiple-images class for visibility in collapsed state
    }
    
    // Remove transition after animation
    setTimeout(() => {
      root.style.transition = '';
      container.style.transition = '';
      console.log('Panel collapsed, final size:', root.style.width, 'x', root.style.height);
      
      // If no images are loaded, show the try button
      if (currentImages.length === 0) {
        showTryThisOutButton();
      }
    }, 300);
  };

  // Minimize functionality
  const minimizePanel = () => {
    isMinimized = true;
    container.classList.add('dy-hidden');
    minimizedBubble.classList.remove('dy-hidden');
    
    // Hide dropdown menu when minimizing
    const dropdown = shadow.querySelector('.dy-dropdown-menu');
    if (dropdown) {
      dropdown.classList.add('dy-hidden');
    }
    
    // Load saved bubble position or use default
    loadBubblePosition();
    
    // Store minimized state
    chrome.storage.local.set({ panelMinimized: true });
    
    // Update navigation state when minimizing
    forceUpdateNavigationState();
  };

  const restorePanel = () => {
    isMinimized = false;
    container.classList.remove('dy-hidden');
    minimizedBubble.classList.add('dy-hidden');
    
    // Store restored state
    chrome.storage.local.set({ panelMinimized: false });
    
    // Update navigation state when restoring
    forceUpdateNavigationState();
    
    // If no images are loaded, show the try button
    if (currentImages.length === 0) {
      showTryThisOutButton();
    }
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
        target.closest('.dy-dropdown-menu') ||
        target.closest('.dy-dropdown-item') ||
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
        console.log('No saved bubble position found, using default bottom-right');
        // Set default position to bottom-right if none saved
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
    
    // Only restore if clicking the content area (not buttons)
    if (e.target.closest('.dy-bubble-content')) {
      console.log('Restoring panel...');
      restorePanel();
    }
  });

  // Side button actions
  container.addEventListener('click', (e) => {
    const action = e.target.closest('.dy-btn')?.dataset.action;
    if (action === 'more') {
      // Toggle dropdown menu
      toggleDropdownMenu();
    } else if (action === 'extract') {
      // Open full screen
      chrome.runtime.sendMessage({ type: 'OPEN_HISTORY_TAB' });
    } else if (action === 'generate') {
      // Generate AI image
      generatePersonalizedImage();
    }
  });


  
    // Function to show/hide overlay
    const toggleOverlay = (visible) => {
      if (visible) {
        root.style.display = 'block';
        // Update navigation state when overlay becomes visible
        setTimeout(() => forceUpdateNavigationState(), 100);
        // If no images are loaded, show the try button
        setTimeout(() => {
          if (currentImages.length === 0) {
            showTryThisOutButton();
          }
        }, 150);
      } else {
        root.style.display = 'none';
      }
    };

    // Listen for messages from popup or service worker
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'TOGGLE_OVERLAY') {
        toggleOverlay(message.visible);
        sendResponse({ ok: true });
      } else if (message.type === 'SITES_CHANGED') {
        // Re-check site support when sites change
        checkIfSiteSupported().then(isSupported => {
          if (!isSupported) {
            // Show overlay on non-supported sites
            toggleOverlay(true);
          } else {
            // Hide overlay on supported sites
            toggleOverlay(false);
          }
        });
        sendResponse({ ok: true });
      }
    });
    
    // Check options to decide if the overlay should be shown by default
    chrome.runtime.sendMessage({ type: 'GET_OVERLAY_STATE' }, async (res) => {
      console.log('GET_OVERLAY_STATE:', res);
      if (res?.ok) {
        // Check if current site is supported before showing overlay
        const isSiteSupported = await checkIfSiteSupported();
        if (!isSiteSupported) {
          // Show overlay on non-supported sites
          toggleOverlay(res.visible);
        } else {
          console.log('Current site is supported, overlay will be shown');
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
        
        // Check if current hostname is in default sites (excluding removed ones)
        const result = await chrome.storage.local.get(['removedDefaultSites']);
        const removedDefaultSites = result.removedDefaultSites || [];
        
        const isInDefaultSites = defaultSites.some(site => {
          const sitePattern = site.replace('/*', '');
          return hostname.includes(sitePattern) && !removedDefaultSites.includes(site);
        });
        
        if (isInDefaultSites) {
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
    
    console.log('document.readyState:', document.readyState);
    // Load saved dimensions and state
    loadSavedDimensions();
    loadSavedState();
    loadBubblePosition();
    
    console.log('document.readyState:', document.readyState);
    // Initialize original dimensions
    originalWidth = parseInt(root.style.width) || 400;
    originalHeight = parseInt(root.style.height) || 300;

    // Initialize image extractor when page is ready
    if (document.readyState === 'loading') {
      console.log('Document is loading, adding DOMContentLoaded listener...');
      document.addEventListener('DOMContentLoaded', initImageExtractor);
    } else {
      console.log('Document is already loaded, initializing image extractor...');
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
  }; // End of initializeOverlayFunctionality

  // Start the initialization
  init();
})();
