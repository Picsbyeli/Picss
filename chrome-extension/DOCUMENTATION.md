# Burble Chrome Extension Documentation

Welcome to the Burble Chrome Extension documentation. This master document provides links to all documentation files related to the extension's development, packaging, and submission.

## Development Documentation

- [README.md](README.md) - Main project overview and details
- [USER_GUIDE.md](USER_GUIDE.md) - Complete user guide for extension users
- [FAQ.md](FAQ.md) - Frequently asked questions about the extension

## Extension Packaging

- [PACKAGING.md](PACKAGING.md) - Instructions for packaging the extension
- [package.sh](package.sh) - Script for creating the extension package (ZIP file)
- [prepare-store-assets.sh](prepare-store-assets.sh) - Script for preparing store assets
- [convert-icons.js](convert-icons.js) - Script for converting SVG icons to PNG

## Installation Documentation

- [INSTALLATION.md](INSTALLATION.md) - Installation instructions for users

## Store Submission

- [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) - Checklist for Chrome Web Store submission
- [store-assets/README.md](store-assets/README.md) - Guide for store assets preparation
- [store-assets/store-description.md](store-assets/store-description.md) - Store listing description
- [store-assets/privacy-policy.md](store-assets/privacy-policy.md) - Privacy policy document

## Store Assets

The `store-assets` directory contains all assets needed for Chrome Web Store submission:

- Icon SVGs (16px, 48px, 128px)
- Screenshot SVGs
- Promotional tile SVGs
- Store description
- Privacy policy

## Development Utilities

- [mock-api.js](mock-api.js) - API mocking utility for offline development and testing

## Complete Extension Workflow

1. **Development**
   - Use manifest.json and HTML/JS/CSS files to build extension functionality
   - Test with Chrome's developer mode

2. **Preparation**
   - Run `./prepare-store-assets.sh` to prepare store assets
   - Convert SVG files to PNG format

3. **Packaging**
   - Run `./package.sh` to create the extension ZIP package

4. **Submission**
   - Follow the checklist in SUBMISSION_CHECKLIST.md
   - Submit package to Chrome Web Store

5. **Installation**
   - After approval, users can install via instructions in INSTALLATION.md

## Directory Structure

```
chrome-extension/
├── manifest.json         # Extension configuration
├── *.html                # HTML files for extension pages
├── *.js                  # JavaScript files for extension functionality
├── css/                  # CSS stylesheets
├── icons/                # Extension icons (PNG format)
├── store-assets/         # Chrome Web Store assets (SVG format)
├── package.sh            # Packaging script
├── prepare-store-assets.sh  # Store assets preparation script
├── convert-icons.js      # Icon conversion utility
└── Documentation files   # Various .md files
```

## Keeping Documentation Updated

When making changes to the extension:

1. Update the relevant documentation files
2. Ensure all scripts still work with the updated structure
3. Test the extension thoroughly before repackaging
4. Use the SUBMISSION_CHECKLIST.md to verify requirements are still met

## Additional Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
- [Chrome Web Store Listing Requirements](https://developer.chrome.com/docs/webstore/publish/)