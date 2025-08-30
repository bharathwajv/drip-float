# Sites Configuration Refactoring

## Overview
This document describes the refactoring changes made to centralize the default sites configuration across the Drip Float extension.

## Changes Made

### 1. Created Centralized Sites Configuration
- **File**: `config/sites.js`
- **Purpose**: Single source of truth for all default sites
- **Features**: 
  - Complete list of 15 default shopping sites
  - Helper functions for site validation
  - Consistent site data structure (url, name, icon, pattern)

### 2. Updated Files to Use Centralized Configuration

#### popup/popup.js
- Removed hardcoded default sites array
- Added import for centralized sites configuration
- Updated site existence checking logic

#### pages/dashboard.js
- Removed hardcoded default sites array
- Added dynamic loading of sites from centralized config
- Added fallback to basic sites if import fails

#### options/options.js
- Updated to load sites from centralized configuration
- Added fallback to sites.json if import fails
- Added final fallback to basic sites

#### content/panel.js
- Updated site support checking to use centralized config
- Added fallback to basic sites if import fails

### 3. Module System Updates
- Updated all HTML files to use `type="module"`
- Updated JavaScript files to use ES6 import/export syntax
- Updated manifest.json to support ES modules

### 4. Files Modified
- `config/sites.js` (new)
- `popup/popup.js`
- `popup/popup.html`
- `popup/storageService.js`
- `pages/dashboard.js`
- `pages/dashboard.html`
- `options/options.js`
- `options/options.html`
- `content/panel.js`
- `manifest.json`

## Benefits

1. **Single Source of Truth**: All default sites are defined in one place
2. **Easier Maintenance**: Adding/removing sites only requires updating one file
3. **Consistency**: All parts of the extension use the same site data
4. **Better Error Handling**: Fallback mechanisms ensure extension works even if import fails
5. **Modern JavaScript**: Uses ES6 modules for better code organization

## Default Sites Included

The centralized configuration includes 15 shopping sites:
- Myntra, AJIO, Flipkart, Amazon India, Nykaa
- Snapdeal, Purplle, Limeroad, Voonik, Koovs
- Tata CLiQ, Reliance Digital, Croma, ShopClues, Paytm Mall

## Fallback Strategy

1. **Primary**: Import from `config/sites.js`
2. **Secondary**: Load from `config/sites.json`
3. **Tertiary**: Use hardcoded basic sites (5 sites)

This ensures the extension remains functional even if the primary configuration fails to load.
