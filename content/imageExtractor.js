// content/imageExtractor.js
class ImageExtractor {
  constructor() {
    this.currentPageImages = [];
    this.ogImage = null;
    this.productImages = [];
  }

  // Extract all available images from the current page
  async extractPageImages() {
    try {
      // Extract Open Graph image
      this.ogImage = this.extractOGImage();
      
      // Extract product images
      this.productImages = this.extractProductImages();
      
      // Extract general page images
      this.currentPageImages = this.extractGeneralImages();
      
      // Combine and prioritize images
      const allImages = this.combineAndPrioritizeImages();
      
      return {
        ogImage: this.ogImage,
        productImages: this.productImages,
        pageImages: this.currentPageImages,
        allImages: allImages,
        primaryImage: allImages[0] || null
      };
    } catch (error) {
      console.error('Error extracting images:', error);
      return {
        ogImage: null,
        productImages: [],
        pageImages: [],
        allImages: [],
        primaryImage: null,
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
  extractGeneralImages() {
    const images = [];
    const imgElements = document.querySelectorAll('img');
    
    imgElements.forEach((img, index) => {
      if (img.src && 
          img.src !== 'data:image/svg+xml;base64,' &&
          img.naturalWidth > 100 && 
          img.naturalHeight > 100) {
        images.push({
          url: img.src,
          type: 'page',
          priority: 3,
          alt: img.alt || `Page Image ${index + 1}`,
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      }
    });

    return images;
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
      price: '',
      brand: '',
      category: ''
    };

    // Extract description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && ogDesc.content) {
      metadata.description = ogDesc.content;
    }

    // Extract price (common selectors)
    const priceSelectors = [
      '.price',
      '.product-price',
      '.price-value',
      '[data-testid*="price"]',
      '.selling-price'
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
      '.brand-name'
    ];

    brandSelectors.forEach(selector => {
      try {
        const element = document.querySelector(selector);
        if (element && !metadata.brand) {
          metadata.brand = element.textContent.trim();
        }
      } catch (e) {}
    });

    return metadata;
  }

  // Create a summary of extracted data
  createExtractionSummary() {
    const images = this.extractPageImages();
    const metadata = this.extractPageMetadata();
    
    return {
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href,
      images: images,
      metadata: metadata,
      extractionStatus: 'success'
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageExtractor;
} else {
  window.ImageExtractor = ImageExtractor;
}
