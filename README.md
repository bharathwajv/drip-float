# Drip Float Overlay - Chrome Extension

A Manifest V3 Chrome extension that injects a draggable floating overlay on shopping pages, featuring a compact design with image preview, action buttons, and a comprehensive popup interface for user management.

## Features

✅ **Floating Overlay**: Compact 280x180px draggable panel positioned in bottom-right corner  
✅ **Drag & Drop**: Click and drag the handle to move the overlay anywhere on the page  
✅ **Hide/Show Toggle**: Options page and popup controls overlay visibility  
✅ **More Menu**: Circular button (⋯) with dropdown for History and Full Page options  
✅ **History Page**: Opens in new tab with sample generated images  
✅ **Popup Interface**: Click extension icon for login, token usage, and quick actions  
✅ **User Authentication**: Login/logout with session persistence  
✅ **Token Management**: Visual display of AI generation token usage  
✅ **Responsive Design**: Clean UI with hover effects and smooth transitions  

## Installation & Testing

### 1. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked" and select this folder
4. The extension should appear in your extensions list

### 2. Test the Overlay

1. Navigate to any website (the extension works on `<all_urls>`)
2. Look for the floating overlay in the bottom-right corner
3. The overlay should appear automatically (unless disabled in options)

### 3. Test the Popup

1. Click the extension icon in the Chrome toolbar
2. You'll see a login form (use any email/password for demo)
3. After login, view your profile, token usage, and quick actions
4. Use the quick action buttons to control the extension

### 4. Test Features

- **Drag**: Click and drag the small handle (gray bar) in the header
- **Close**: Click the ✕ button to hide the overlay
- **More Menu**: Click the circular ⋯ button to see options
- **History**: Click "History" in the more menu or popup to open full page
- **Login**: Use any email/password combination in the popup
- **Token Usage**: View your AI generation token consumption
- **Quick Actions**: Toggle overlay, open history, access settings

### 5. Access Options

1. Right-click the extension icon in Chrome toolbar
2. Select "Options" 
3. Toggle "Show overlay by default" on/off
4. Refresh any page to see the change take effect

## File Structure

```
drip-float-overlay/
├── manifest.json          # Extension configuration
├── sw.js                  # Service worker (background)
├── content/
│   ├── panel.js          # Content script (injects overlay)
│   └── panel.css         # Overlay styling
├── popup/
│   ├── popup.html        # Popup UI (extension icon click)
│   └── popup.js          # Popup functionality
├── options/
│   ├── options.html      # Options page UI
│   └── options.js        # Options page logic
└── pages/
    └── history.html      # History page (opens in new tab)
```

## Popup Features

### Authentication
- **Login Form**: Email and password fields with validation
- **Session Management**: Persistent login state across browser sessions
- **User Profile**: Display user name, email, and avatar

### Token Usage
- **Visual Progress Bar**: Shows used vs. remaining AI generation tokens
- **Real-time Updates**: Token consumption tracking (mock data for demo)
- **Usage Statistics**: Clear display of current token status

### Quick Actions
- **History**: Opens full history page in new tab
- **Toggle Overlay**: Show/hide the floating overlay on current page
- **Settings**: Opens extension options page
- **Help**: Displays support information

## Technical Details

- **Manifest V3**: Uses modern Chrome extension architecture
- **Shadow DOM**: Overlay renders in isolated shadow DOM to avoid CSS conflicts
- **Service Worker**: Handles background tasks, tab creation, and messaging
- **Chrome Storage**: Persists user preferences, auth state, and overlay visibility
- **Content Scripts**: Injects overlay on all matching pages
- **Message Passing**: Communication between popup, content script, and service worker
- **Popup API**: Chrome extension popup for main user interface

## Customization

### Styling
- Edit `content/panel.css` to modify overlay appearance
- Edit `popup/popup.html` to customize popup design
- Adjust dimensions in both CSS and JavaScript files

### Positioning
- Change default position in `content/panel.js` (lines 8-12)
- Modify drag behavior in the drag event handlers

### Options
- Add new settings in `options/options.html` and `options/options.js`
- Update service worker to handle new option types
- Extend popup functionality in `popup/popup.js`

### Authentication
- Replace mock login in `popup/popup.js` with real API calls
- Implement proper token refresh and validation
- Add additional user profile fields as needed

## Future Enhancements

- [ ] Real product page detection and metadata extraction
- [ ] AI image generation integration with actual providers
- [ ] Real-time collaboration features with Firebase
- [ ] WebRTC for live co-editing sessions
- [ ] Advanced token management and billing integration
- [ ] User preferences and customization options
- [ ] Analytics and usage tracking

## Troubleshooting

**Overlay not appearing?**
- Check if extension is enabled in `chrome://extensions/`
- Verify options page setting for "Show overlay by default"
- Check popup overlay toggle state
- Refresh the page after making changes

**Can't drag the overlay?**
- Make sure you're clicking the small gray handle bar in the header
- Check browser console for any JavaScript errors

**Popup not working?**
- Ensure the extension has storage permission
- Check browser console for storage-related errors
- Verify popup HTML and JavaScript files are properly loaded

**Login issues?**
- Current implementation uses mock authentication
- Check browser console for any JavaScript errors
- Verify storage permissions are granted

**Options not saving?**
- Ensure the extension has storage permission
- Check browser console for storage-related errors
- Verify service worker is active

## Browser Compatibility

- **Chrome 88+** (Manifest V3 support required)
- **Edge 88+** (Chromium-based)
- **Other Chromium-based browsers**

## Demo Credentials

For testing purposes, the extension accepts any email and password combination:
- **Email**: Any valid email format (e.g., `user@example.com`)
- **Password**: Any non-empty string

---

Built with ❤️ for the Drip Float fashion collaboration platform