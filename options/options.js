// options/options.js
class DripFloatOptions {
  constructor() {
    this.defaultSites = [];
    this.customSites = [];
    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadDefaultSites();
    await this.loadUserSites();
    await this.loadOverlaySettings();
    this.renderSites();
  }

  bindEvents() {
    // Overlay toggle
    const toggleSwitch = document.getElementById('toggleSwitch');
    toggleSwitch.addEventListener('click', () => this.handleOverlayToggle());

    // Add site form
    const addSiteBtn = document.getElementById('addSiteBtn');
    const newSiteUrl = document.getElementById('newSiteUrl');
    
    addSiteBtn.addEventListener('click', () => this.addCustomSite());
    newSiteUrl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addCustomSite();
    });
  }

  async loadDefaultSites() {
    try {
      // Try to load from centralized sites configuration
      const { DEFAULT_SITES } = await import('../config/sites.js');
      this.defaultSites = DEFAULT_SITES.map(site => site.pattern);
      this.siteNames = {};
      DEFAULT_SITES.forEach(site => {
        this.siteNames[site.pattern] = site.name;
      });
    } catch (error) {
      console.error('Error loading default sites:', error);
      // Fallback to sites.json if import fails
      try {
        const response = await fetch(chrome.runtime.getURL('config/sites.json'));
        const config = await response.json();
        this.defaultSites = config.defaultSites || [];
        this.siteNames = config.siteNames || {};
      } catch (jsonError) {
        console.error('Error loading sites.json:', jsonError);
        // Final fallback to basic sites
        this.defaultSites = [
          'https://www.myntra.com/*',
          'https://www.ajio.com/*',
          'https://www.flipkart.com/*',
          'https://www.amazon.in/*'
        ];
        this.siteNames = {
          'https://www.myntra.com/*': 'Myntra',
          'https://www.ajio.com/*': 'AJIO',
          'https://www.flipkart.com/*': 'Flipkart',
          'https://www.amazon.in/*': 'Amazon India'
        };
      }
    }
  }

  async loadUserSites() {
    try {
      const result = await chrome.storage.local.get(['customSites']);
      this.customSites = result.customSites || [];
    } catch (error) {
      console.error('Error loading user sites:', error);
      this.customSites = [];
    }
  }

  async loadOverlaySettings() {
    try {
      const result = await chrome.storage.local.get({ 
        showOverlayByDefault: true, 
        overlayVisible: true 
      });
      
      const shouldShow = result.overlayVisible !== undefined ? 
        result.overlayVisible : result.showOverlayByDefault;
      
      const toggleSwitch = document.getElementById('toggleSwitch');
      if (shouldShow) {
        toggleSwitch.classList.add('active');
      }
    } catch (error) {
      console.error('Error loading overlay settings:', error);
    }
  }

  renderSites() {
    const sitesList = document.getElementById('sitesList');
    sitesList.innerHTML = '';

    // Render default sites
    this.defaultSites.forEach(site => {
      const siteItem = this.createSiteItem(site, this.siteNames[site] || site, true);
      sitesList.appendChild(siteItem);
    });

    // Render custom sites
    this.customSites.forEach(site => {
      const siteItem = this.createSiteItem(site, this.getSiteName(site), false);
      sitesList.appendChild(siteItem);
    });
  }

  createSiteItem(url, name, isDefault) {
    const siteItem = document.createElement('div');
    siteItem.className = 'site-item';
    
    const domain = this.extractDomain(url);
    const icon = domain.charAt(0).toUpperCase();
    
    siteItem.innerHTML = `
      <div class="site-info">
        <div class="site-icon">${icon}</div>
        <div class="site-details">
          <h4>${name}</h4>
          <p>${url}</p>
        </div>
      </div>
      <div class="site-actions">
        ${!isDefault ? `<button class="btn-small danger remove-site" data-url="${url}" title="Remove site">🗑️</button>` : ''}
      </div>
    `;

    // Add remove event listener for custom sites
    if (!isDefault) {
      const removeBtn = siteItem.querySelector('.remove-site');
      removeBtn.addEventListener('click', () => this.removeCustomSite(url));
    }

    return siteItem;
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace('https://', '').replace('http://', '').replace('/*', '');
    }
  }

  getSiteName(url) {
    const domain = this.extractDomain(url);
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  async addCustomSite() {
    const input = document.getElementById('newSiteUrl');
    const url = input.value.trim();

    if (!url) {
      this.showStatus('Please enter a valid URL', 'error');
      return;
    }

    // Validate URL format
    if (!this.isValidUrl(url)) {
      this.showStatus('Please enter a valid URL starting with https://', 'error');
      return;
    }

    // Check if site already exists
    if (this.defaultSites.includes(url) || this.customSites.includes(url)) {
      this.showStatus('This site is already in the list', 'error');
      return;
    }

    // Add custom site
    this.customSites.push(url);
    await this.saveCustomSites();
    this.renderSites();
    
    input.value = '';
    this.showStatus('Site added successfully!', 'success');
  }

  isValidUrl(url) {
    return url.startsWith('https://') || url.startsWith('http://');
  }

  async removeCustomSite(url) {
    const index = this.customSites.indexOf(url);
    if (index > -1) {
      this.customSites.splice(index, 1);
      await this.saveCustomSites();
      this.renderSites();
      this.showStatus('Site removed successfully!', 'success');
    }
  }

  async saveCustomSites() {
    try {
      await chrome.storage.local.set({ customSites: this.customSites });
    } catch (error) {
      console.error('Error saving custom sites:', error);
      this.showStatus('Failed to save site changes', 'error');
    }
  }

  async handleOverlayToggle() {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const isActive = toggleSwitch.classList.contains('active');
    const newValue = !isActive;
    
    // Update UI immediately for better UX
    if (newValue) {
      toggleSwitch.classList.add('active');
    } else {
      toggleSwitch.classList.remove('active');
    }
    
    // Save to storage
    try {
      await chrome.storage.local.set({ 
        showOverlayByDefault: newValue,
        overlayVisible: newValue 
      });
      
      // Show feedback
      this.showStatus(
        newValue ? 'Overlay will show by default' : 'Overlay will be hidden by default', 
        'success'
      );
      
      // Notify content scripts about the change
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        try {
          chrome.tabs.sendMessage(tab.id, { 
            type: 'TOGGLE_OVERLAY', 
            visible: newValue 
          });
        } catch (e) {
          // Tab might not have content script loaded
        }
      });
    } catch (error) {
      console.error('Error saving overlay settings:', error);
      this.showStatus('Failed to save settings', 'error');
    }
  }

  showStatus(message, type = 'success') {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.style.display = 'block';

    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// Initialize options when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DripFloatOptions();
});