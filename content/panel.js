// content/panel.js
(() => {
  // Create the root element to host the shadow DOM
  const root = document.createElement('div');
  root.id = 'dripyou-float-root';
  Object.assign(root.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 2147483647,
    width: '300px',
    height: '180px',
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
      <div class="dy-drag-handle" title="Drag to move"></div>
      <button class="dy-close" aria-label="Close">✕</button>
    </div>
    <div class="dy-body">
      <div class="dy-image-slot" aria-label="Image view">
        <div class="dy-image-placeholder">
          <div class="dy-loading">🔄</div>
          <div class="dy-loading-text">Extracting images...</div>
        </div>
      </div>
      <div class="dy-side-buttons">
        <button class="dy-btn" data-action="extract" title="Extract Images">📷</button>
        <button class="dy-btn" data-action="generate" title="Generate AI Image">✨</button>
      </div>
    </div>
  `;

  // "More options" bubble
  const moreBubble = document.createElement('button');
  moreBubble.className = 'dy-more-bubble';
  moreBubble.textContent = '⋯';
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
  shadow.appendChild(moreBubble);
  shadow.appendChild(menu);
  document.documentElement.appendChild(root);

  // Initialize image extractor
  let imageExtractor = null;
  let currentImages = [];
  let currentImageIndex = 0;

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

    try {
      showImageLoading();
      
      const result = await imageExtractor.extractPageImages();
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
          <div class="dy-image-type">${currentImage.type}</div>
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
        target.closest('.dy-menu-item')) {
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

  // --- UI Event Listeners ---
  container.querySelector('.dy-close').addEventListener('click', () => {
    root.style.display = 'none';
    // Update storage to reflect hidden state
    chrome.storage.local.set({ overlayVisible: false });
  });

  // Side button actions
  container.addEventListener('click', (e) => {
    const action = e.target.closest('.dy-btn')?.dataset.action;
    if (action === 'extract') {
      extractAndDisplayImages();
    } else if (action === 'generate') {
      // Future: Generate AI image
      showImageSuccess('AI generation coming soon!');
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
  chrome.runtime.sendMessage({ type: 'GET_OVERLAY_STATE' }, (res) => {
    if (res?.ok) {
      toggleOverlay(res.visible);
    }
  });

  // Initialize image extractor when page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageExtractor);
  } else {
    initImageExtractor();
  }
})();
