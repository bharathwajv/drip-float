# Drip Float Overlay - Chrome Extension

A Manifest V3 Chrome extension that injects a draggable floating overlay on shopping pages, featuring AI-powered image generation, personalized product visualization, and a comprehensive popup interface.

## ✨ New Features

🤖 **AI Image Generation**: Generate personalized product images using Google Gemini API  
🔄 **Daisy Chain Mode**: Use generated images as input for subsequent generations  
📐 **Resizable Popup**: Customizable popup size with persistent settings  
🛍️ **Smart Site Detection**: Automatic product extraction from 15+ shopping sites  
📱 **Cross-Site Persistence**: Daisy chain images persist across different websites  

## 🚀 Quick Setup

### 1. Get Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy your API key

### 2. Configure Extension
1. Open `AI/imagegen.js`
2. Replace `'AIzaSyB4nJbdrowqPWDN0i5VjF3b8LzYkqb0jaA'` with your actual API key
3. Save the file

### 3. Load Extension
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select this folder

## 🎯 Core Features

### Floating Overlay
- **280x180px** draggable panel in bottom-right corner
- **Drag & Drop**: Click handle to move anywhere on page
- **Hide/Show**: Toggle via options or popup controls
- **More Menu**: History and full page options

### AI Image Generation
- **Personalized Products**: Replace models with user photos
- **Smart Extraction**: Automatically detects product images and descriptions
- **High Quality**: 8K commercial fashion photography style
- **Fast Generation**: Optimized for quick response times

### Daisy Chain Mode
- **Progressive Personalization**: Each generation builds on the previous
- **Cross-Site Continuity**: Generated images persist across websites
- **Easy Toggle**: Switch between default and chained modes
- **Visual Feedback**: Link/unlink icons with animations

### Popup Interface
- **Resizable Design**: Customize popup size (300x400px minimum)
- **User Authentication**: Login with session persistence
- **Token Management**: Visual AI generation token usage
- **Quick Actions**: History, overlay toggle, settings access

## 🛍️ Supported Sites

**Fashion & Beauty**: Myntra, AJIO, Nykaa, Purplle, Voonik, Limeroad  
**E-commerce**: Flipkart, Amazon India, Snapdeal, ShopClues  
**Electronics**: Tata CLiQ, Reliance Digital, Croma  
**Others**: Koovs, Paytm Mall  

## 📁 File Structure

```
drip-float-overlay/
├── AI/
│   ├── imagegen.js          # Gemini API integration
│   ├── prompt.txt           # AI generation prompts
│   └── userImageBase64.txt  # Default user image
├── config/
│   └── sites.js            # Centralized site configuration
├── content/
│   ├── panel.js            # Floating overlay logic
│   └── panel.css           # Overlay styling
├── popup/
│   ├── popup.html          # Resizable popup UI
│   ├── popup.js            # Popup functionality
│   └── storageService.js   # Storage management
├── options/
│   ├── options.html        # Extension settings
│   └── options.js          # Settings logic
└── pages/
    ├── dashboard.html      # User dashboard
    └── history.html        # Generated images history
```

## 🔧 Technical Details

- **Manifest V3**: Modern Chrome extension architecture
- **Shadow DOM**: Isolated overlay rendering
- **Service Worker**: Background tasks and messaging
- **Chrome Storage**: Persistent user preferences and data
- **ES6 Modules**: Modern JavaScript organization
- **Cross-Site Persistence**: Daisy chain images across websites

## 🎨 Customization

### Styling
- Edit `content/panel.css` for overlay appearance
- Modify `popup/popup.html` for popup design
- Adjust dimensions in CSS and JavaScript files

### AI Generation
- Update `AI/prompt.txt` for different generation styles
- Modify `AI/userImageBase64.txt` for default user image
- Adjust generation parameters in `AI/imagegen.js`

### Site Configuration
- Add new sites in `config/sites.js`
- Update site patterns for automatic detection
- Configure site-specific extraction logic

## 🔍 Troubleshooting

**Overlay not appearing?**
- Check extension is enabled in `chrome://extensions/`
- Verify "Show overlay by default" in options
- Refresh page after changes

**AI generation failing?**
- Ensure valid Gemini API key is set in `AI/imagegen.js`
- Check browser console for API errors
- Verify internet connection

**Daisy chain not working?**
- Check Chrome storage permissions
- Verify daisy chain button state
- Clear browser cache if needed

## 🌐 Browser Compatibility

- **Chrome 88+** (Manifest V3 required)
- **Edge 88+** (Chromium-based)
- **Other Chromium browsers**

## 📝 Demo Credentials

For testing, use any email/password combination:
- **Email**: `user@example.com`
- **Password**: Any non-empty string

---

## ⚠️ IMPORTANT CAUTION

**This code was generated using Cursor AI and requires thorough review before production usage.**

- **Code Review Required**: All generated code should be carefully reviewed for security, functionality, and best practices
- **Production Readiness**: This extension is provided as-is and may require modifications for production deployment
- **User Discretion**: Users are responsible for validating all code before using in production environments
- **Testing Recommended**: Thorough testing is advised before deployment to ensure proper functionality and security

Please review all code thoroughly and make necessary adjustments before using in production.

Built with ❤️ by Bharathwaj Vasudevan