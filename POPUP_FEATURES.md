# Popup Features Documentation

## Resizable Popup

The Drip Float extension now includes a resizable popup with the following features:

### Resize Toggle Button
- Located in the top-right corner of the header
- Click to enable/disable resizable functionality
- Shows ↔ when enabled, ⊞ when disabled
- State is persisted in local storage

### Resize Handle
- Appears as a small diagonal pattern in the bottom-right corner when resizable is enabled
- Drag to resize the popup
- Minimum dimensions: 300x400 pixels
- Maximum dimensions: No hard limit (browser dependent)

### Storage Service

A centralized `StorageService` class handles all Chrome storage operations:

#### User Management
- `getUser()` - Get current user data
- `setUser(user)` - Save user data
- `removeUser()` - Remove user data
- `isLoggedIn()` - Check login status
- `setLoginStatus(status)` - Set login status

#### User Sites Management
- `getUserSites()` - Get user's custom sites
- `setUserSites(sites)` - Save user sites
- `addUserSite(site)` - Add a new site
- `removeUserSite(siteUrl)` - Remove a site

#### Popup Settings
- `getPopupSettings()` - Get popup configuration
- `setPopupSettings(settings)` - Save popup configuration
- `updatePopupSize(width, height)` - Update popup dimensions
- `setResizable(resizable)` - Enable/disable resize functionality

#### Generic Methods
- `get(keys)` - Get data from storage
- `set(data)` - Save data to storage
- `remove(keys)` - Remove data from storage
- `clearAll()` - Clear all stored data

### Error Handling

All storage operations include proper error handling:
- Promise-based async/await pattern
- Chrome runtime error detection
- Graceful fallbacks for failed operations
- User-friendly error messages

### Usage Example

```javascript
// Initialize storage service
const storageService = new StorageService();

// Get popup settings
const settings = await storageService.getPopupSettings();

// Update popup size
await storageService.updatePopupSize(500, 600);

// Toggle resizable
await storageService.setResizable(false);
```

### Persistence

All popup settings are automatically saved to Chrome's local storage:
- Popup dimensions (width, height)
- Resizable state (enabled/disabled)
- User preferences and data
- Custom site configurations

The popup will remember its size and settings between sessions, providing a consistent user experience.
