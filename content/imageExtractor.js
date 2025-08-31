// content/imageExtractor.js
class ImageExtractor {
  constructor() {
    this.currentPageImages = [];
    this.ogImage = null;
    this.productImages = [];
    this.pageMetadata = null;
  }

  // Extract all available images from the current page
  async extractPageImages() {
    try {
      // Extract Open Graph image
      this.ogImage = this.extractOGImage();
      
      // Extract product images
      this.productImages = this.extractProductImages();
      
      // Extract general page images (now async)
      this.currentPageImages = await this.extractGeneralImages();
      
      // Extract page metadata
      this.pageMetadata = this.extractPageMetadata();
      
      // Combine and prioritize images
      const allImages = this.combineAndPrioritizeImages();
      
      return {
        ogImage: this.ogImage,
        productImages: this.productImages,
        pageImages: this.currentPageImages,
        allImages: allImages,
        primaryImage: allImages[0] || null,
        metadata: this.pageMetadata
      };
    } catch (error) {
      console.error('Error extracting images:', error);
      return {
        ogImage: null,
        productImages: [],
        pageImages: [],
        allImages: [],
        primaryImage: null,
        metadata: null,
        error: error.message
      };
    }
  }

  // Extract Open Graph image
  extractOGImage() {
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.content) {
      return {
        url: ogImage.content,
        type: 'og:image',
        priority: 1,
        alt: 'Open Graph Image'
      };
    }
    return null;
  }

  // Extract product images from various sources
  extractProductImages() {
    const images = [];
    
    // Common product image selectors for shopping sites
    const selectors = [
      // Myntra
      '.product-image img',
      '.product-preview-image img',
      '.product-detail-image img',
      '.product-gallery img',
      
      // AJIO
      '.prod-img img',
      '.product-image img',
      '.gallery-image img',
      
      // Flipkart
      '.product-image img',
      '.imgContainer img',
      '.product-gallery img',
      
      // Amazon
      '.a-dynamic-image',
      '.product-image img',
      '.maintain-height img',
      
      // Generic
      '[data-testid*="image"] img',
      '[class*="product"] img',
      '[class*="gallery"] img',
      '.main-image img',
      '.hero-image img'
    ];

    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
          if (el.src && el.src !== 'data:image/svg+xml;base64,') {
            images.push({
              url: el.src,
              type: 'product',
              priority: 2,
              alt: el.alt || `Product Image ${index + 1}`,
              width: el.naturalWidth || el.width,
              height: el.naturalHeight || el.height
            });
          }
        });
      } catch (e) {
        // Ignore selector errors
      }
    });

    return images;
  }

  // Extract general page images
  async extractGeneralImages() {
    const images = [];
    const imgElements = document.querySelectorAll('img');
    
    for (let i = 0; i < imgElements.length; i++) {
      const img = imgElements[i];
      
      if (img.src && 
          img.src !== 'data:image/svg+xml;base64,' &&
          img.naturalWidth > 100 && 
          img.naturalHeight > 100) {
        
        // Check if image is portrait and convert to landscape with white space
        let processedUrl = img.src;
        let processedWidth = img.naturalWidth;
        let processedHeight = img.naturalHeight;
        
        if (img.naturalHeight > img.naturalWidth) {
          // Portrait image - convert to landscape
          try {
            processedUrl = await this.convertPortraitToLandscape(img.src, img.naturalWidth, img.naturalHeight);
            processedWidth = img.naturalHeight; // Swap dimensions
            processedHeight = img.naturalHeight; // Keep height, width becomes height
          } catch (error) {
            console.warn('Failed to convert portrait image to landscape:', error);
            // Keep original URL if conversion fails
          }
        }
        
        images.push({
          url: processedUrl,
          type: 'page',
          priority: 3,
          alt: img.alt || `Page Image ${i + 1}`,
          width: processedWidth,
          height: processedHeight,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight
        });
      }
    }

    return images;
  }

  // Convert portrait image to landscape by adding white space
  convertPortraitToLandscape(imageUrl, originalWidth, originalHeight) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Create landscape canvas (height becomes width)
        const landscapeWidth = originalHeight;
        const landscapeHeight = originalHeight;
        
        canvas.width = landscapeWidth;
        canvas.height = landscapeHeight;
        
        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, landscapeWidth, landscapeHeight);
        
        // Calculate centering position
        const x = (landscapeWidth - originalWidth) / 2;
        const y = 0;
        
        // Draw original image centered
        ctx.drawImage(img, x, y, originalWidth, originalHeight);
        
        // Convert to data URL
        const landscapeUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(landscapeUrl);
      };
      
      img.onerror = () => {
        // If processing fails, return original URL
        resolve(imageUrl);
      };
      
      img.src = imageUrl;
    });
  }

  // Combine and prioritize images
  combineAndPrioritizeImages() {
    const allImages = [];
    
    // Add OG image first if available
    if (this.ogImage) {
      allImages.push(this.ogImage);
    }
    
    // Add product images
    allImages.push(...this.productImages);
    
    // Add page images
    allImages.push(...this.currentPageImages);
    
    // Remove duplicates and sort by priority
    const uniqueImages = this.removeDuplicateImages(allImages);
    return uniqueImages.sort((a, b) => a.priority - b.priority);
  }

  // Remove duplicate images based on URL
  removeDuplicateImages(images) {
    const seen = new Set();
    return images.filter(img => {
      if (seen.has(img.url)) {
        return false;
      }
      seen.add(img.url);
      return true;
    });
  }

  // Get the best image for display
  getBestImage() {
    if (this.ogImage) return this.ogImage;
    if (this.productImages.length > 0) return this.productImages[0];
    if (this.currentPageImages.length > 0) return this.currentPageImages[0];
    return null;
  }

  // Extract page metadata
  extractPageMetadata() {
    const metadata = {
      title: document.title,
      url: window.location.href,
      description: '',
      ogDescription: '',
      price: '',
      brand: '',
      category: '',
      productName: ''
    };

    // Extract Open Graph description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && ogDesc.content) {
      metadata.ogDescription = ogDesc.content;
      metadata.description = ogDesc.content; // Use og:description as primary description
    }

    // Extract meta description as fallback
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.content && !metadata.description) {
      metadata.description = metaDesc.content;
    }

    // Extract product name from various sources
    const productNameSelectors = [
      'meta[property="og:title"]',
      'meta[name="title"]',
      'h1',
      '.product-title',
      '.product-name',
      '[data-testid*="title"]',
      '.title'
    ];

    productNameSelectors.forEach(selector => {
      try {
        const element = document.querySelector(selector);
        if (element && !metadata.productName) {
          if (element.tagName === 'META') {
            metadata.productName = element.content || element.getAttribute('content') || '';
          } else {
            metadata.productName = element.textContent.trim();
          }
        }
      } catch (e) {}
    });

    // Extract price (common selectors)
    const priceSelectors = [
      '.price',
      '.product-price',
      '.price-value',
      '[data-testid*="price"]',
      '.selling-price',
      '.mrp',
      '.discount-price'
    ];

    priceSelectors.forEach(selector => {
      try {
        const element = document.querySelector(selector);
        if (element && !metadata.price) {
          metadata.price = element.textContent.trim();
        }
      } catch (e) {}
    });

    // Extract brand
    const brandSelectors = [
      '.brand',
      '.product-brand',
      '[data-testid*="brand"]',
      '.brand-name',
      'meta[property="product:brand"]'
    ];

    brandSelectors.forEach(selector => {
      try {
        const element = document.querySelector(selector);
        if (element && !metadata.brand) {
          if (element.tagName === 'META') {
            metadata.brand = element.content || element.getAttribute('content') || '';
          } else {
            metadata.brand = element.textContent.trim();
          }
        }
      } catch (e) {}
    });

    // Extract category
    const categorySelectors = [
      '.category',
      '.product-category',
      '[data-testid*="category"]',
      '.breadcrumb-item:last-child',
      'meta[property="product:category"]'
    ];

    categorySelectors.forEach(selector => {
      try {
        const element = document.querySelector(selector);
        if (element && !metadata.category) {
          if (element.tagName === 'META') {
            metadata.category = element.content || element.getAttribute('content') || '';
          } else {
            metadata.category = element.textContent.trim();
          }
        }
      } catch (e) {}
    });

    return metadata;
  }

  // Create a summary of extracted data
  async createExtractionSummary() {
    const images = await this.extractPageImages();
    const metadata = this.extractPageMetadata();
    
    return {
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href,
      images: images,
      metadata: metadata,
      extractionStatus: 'success'
    };
  }

  // Get product description for image generation
  getProductDescription() {
    if (!this.pageMetadata) {
      this.pageMetadata = this.extractPageMetadata();
    }

    // Try to construct a meaningful product description
    let description = '';

    if (this.pageMetadata.productName) {
      description += this.pageMetadata.productName;
    }

    if (this.pageMetadata.brand) {
      description = `${this.pageMetadata.brand} ${description}`.trim();
    }

    if (this.pageMetadata.category) {
      description += ` in ${this.pageMetadata.category}`;
    }

    if (this.pageMetadata.ogDescription) {
      // Use og:description if available
      description = this.pageMetadata.ogDescription;
    }

    // Fallback to page title if no description
    if (!description || description.trim() === '') {
      description = this.pageMetadata.title || 'Product';
    }

    return description.trim();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageExtractor;
} else {
  window.ImageExtractor = ImageExtractor;
}
