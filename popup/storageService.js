// popup/storageService.js
class StorageService {
  constructor() {
    this.storage = chrome.storage.local;
  }

  // Generic get method
  async get(keys) {
    return new Promise((resolve, reject) => {
      this.storage.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  // Generic set method
  async set(data) {
    return new Promise((resolve, reject) => {
      this.storage.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  // Generic remove method
  async remove(keys) {
    return new Promise((resolve, reject) => {
      this.storage.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  // User management
  async getUser() {
    const result = await this.get(['user']);
    return result.user || null;
  }

  async setUser(user) {
    await this.set({ user });
  }

  async removeUser() {
    await this.remove(['user']);
  }

  async isLoggedIn() {
    const result = await this.get(['isLoggedIn']);
    return result.isLoggedIn || false;
  }

  async setLoginStatus(status) {
    await this.set({ isLoggedIn: status });
  }

  // User sites management
  async getUserSites() {
    const result = await this.get(['userSites']);
    return result.userSites || [];
  }

  async setUserSites(sites) {
    await this.set({ userSites: sites });
  }

  async addUserSite(site) {
    const sites = await this.getUserSites();
    sites.push(site);
    await this.setUserSites(sites);
  }

  async removeUserSite(siteUrl) {
    const sites = await this.getUserSites();
    const filteredSites = sites.filter(site => site.url !== siteUrl);
    await this.setUserSites(filteredSites);
  }

  // Popup settings
  async getPopupSettings() {
    const result = await this.get(['popupSettings']);
    return result.popupSettings || {
      width: 380,
      height: 500,
      isResizable: true
    };
  }

  async setPopupSettings(settings) {
    await this.set({ popupSettings: settings });
  }

  async updatePopupSize(width, height) {
    const currentSettings = await this.getPopupSettings();
    currentSettings.width = width;
    currentSettings.height = height;
    await this.setPopupSettings(currentSettings);
  }

  async setResizable(resizable) {
    const currentSettings = await this.getPopupSettings();
    currentSettings.isResizable = resizable;
    await this.setPopupSettings(currentSettings);
  }

  // Clear all data
  async clearAll() {
    return new Promise((resolve, reject) => {
      this.storage.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageService;
}
