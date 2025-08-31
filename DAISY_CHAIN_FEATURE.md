# Daisy Chain Feature

## Overview
The Daisy Chain feature allows users to use generated AI images as the new user image for subsequent generations. This creates a chain of personalized images where each generated image becomes the base for the next generation.

## How It Works

### Default Mode (Unlinked)
- Uses the default user image from `AI/userImageBase64.txt`
- Each generation starts fresh with the original user image
- Button shows unlink icon (🔗)

### Daisy Chain Mode (Linked)
- Uses the most recently generated image as the new user image
- Creates a continuous chain of personalized generations
- Button shows link icon (🔗) with blue background and green indicator
- Generated images become progressively more personalized

## UI Elements

### Button Location
- Located between "More Options" and "Extract" buttons in the side panel
- Uses link/unlink icons from `icons/link.svg` and `icons/unlink.svg`

### Visual States
- **Inactive**: Unlink icon, gray background
- **Active**: Link icon, blue background with glow effect, green pulsing indicator

### Animations
- Smooth icon transition between link/unlink states
- Pulse animation when activating
- Hover effects with scale transformation
- Green indicator dot with continuous pulse animation

## Technical Implementation

### State Management
- `isDaisyChainEnabled`: Boolean flag for current mode
- `daisyChainUserImage`: Stores the generated image base64 data
- Persisted in Chrome storage for session continuity and cross-site functionality

### Functions Added
- `toggleDaisyChain()`: Toggle between modes
- `loadDaisyChainState()`: Load saved state and stored image on initialization
- `updateUserImageBase64()`: Update AI module with new user image
- `resetToDefaultUserImage()`: Reset to original user image
- Cross-site persistence: Daisy chain images stored in Chrome local storage

### Integration Points
- Modified `generatePersonalizedImage()` to accept optional daisy chain image
- Updated button click handler to handle daisy chain action
- Enhanced CSS for visual feedback and animations
- Added local storage integration for cross-site persistence

## Usage Flow

1. **Enable Daisy Chain**: Click the daisy chain button (unlink icon)
2. **Generate Image**: Use "Try it on" or generate AI image
3. **Chain Continues**: Next generation uses the generated image as user image
4. **Cross-Site Persistence**: Generated images are automatically loaded on different websites
5. **Disable**: Click button again to return to default mode

## Cross-Site Functionality

### How It Works
- When daisy chain is enabled and an image is generated, it's stored in Chrome local storage
- The stored image is automatically loaded when visiting different websites
- The ImageGen module is updated with the stored image during initialization
- Users can continue their daisy chain across multiple shopping sites

### Storage Management
- Images are stored as base64 data in `chrome.storage.local`
- Storage is cleared when daisy chain is disabled
- Automatic cleanup prevents storage bloat
- Compatible with Chrome's storage limits

## Benefits

- **Progressive Personalization**: Each generation builds on the previous
- **Creative Exploration**: Users can explore different style variations
- **Consistent Identity**: Maintains user identity while evolving style
- **Flexible Workflow**: Easy to switch between modes as needed
- **Cross-Site Continuity**: Daisy chain images persist across different websites

## Technical Notes

- Daisy chain state persists across browser sessions
- Generated images are stored as base64 data in Chrome local storage for cross-site persistence
- Fallback to default user image when daisy chain is disabled
- Memory efficient with single image storage
- Compatible with existing image generation pipeline
- Automatic loading of stored daisy chain images when ImageGen module initializes
