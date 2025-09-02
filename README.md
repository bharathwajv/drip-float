# Drip Float Overlay - Chrome Extension

A Manifest V3 Chrome extension that injects a draggable floating overlay on shopping pages, featuring AI-powered image generation, personalized product visualization, and a comprehensive popup interface.

## ✨ Features

🤖 **AI Image Generation**: Generate personalized product images using Google Gemini API  
🔄 **Daisy Chain Mode**: Use generated images as input for subsequent generations  
📐 **Resizable Popup**: Customizable popup size with persistent settings  
📱 **Cross-Site Persistence**: Daisy chain images persist across different websites  
🖼️ **Smart Image Detection**: Automatically extracts product images from site's og:image meta tags  
📤 **Drag & Drop Fallback**: When og:image is not available, users can drag and drop their own product images *(to be implemented)*

> **How it works**: The extension automatically detects product images from the website's og:image meta tags. If no og:image is found or available, users can manually drag and drop product images into the overlay for AI processing.  

## 🚀 Quick Setup

### Option 1: Test Mode (No API Key Required)

1. **Enable Test Mode**
   - Open `AI/imagegen.js`
   - Ensure `const testMode = true;` is set (default)
   - This mode uses test data for demonstration

2. **Load Extension**
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → Select this folder

### Option 2: Live Mode (With API Key)

1. **Get Gemini API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy your API key

2. **Configure Extension**
   - Open `AI/imagegen.js`
   - Set `const testMode = false;`
   - Replace `'your code here'` with your actual API key
   - Save the file

3. **Configure User Image (Optional)**
   - Convert your image to base64 using an online tool like [Base64 Guru](https://base64.guru/converter/encode/image/png)
   - Replace the content in `AI/userImageBase64.txt` with your converted image
   - This will be used as the default user image for AI generation

4. **Load Extension**
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → Select this folder

> **Note**: Dashboard features are not implemented in this version. This is a prototype MVP focused on the floating extension functionality.

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

The extension includes default configurations for several popular shopping sites, but it's not limited to these. The site detection system can be extended to support additional websites by updating the configuration files.

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

## 🌐 Browser Compatibility

- **Chrome 88+** (Manifest V3 required)
- **Edge 88+** (Chromium-based)
- **Other Chromium browsers**

---

## ⚠️ IMPORTANT CAUTION

**This code was generated using Cursor AI and requires thorough review before production usage.**

- **Code Review Required**: All generated code should be carefully reviewed for security, functionality, and best practices
- **Production Readiness**: This extension is provided as-is and may require modifications for production deployment
- **User Discretion**: Users are responsible for validating all code before using in production environments

Please review all code thoroughly and make necessary adjustments before using in production.

Built with ❤️ by Bharathwaj Vasudevan