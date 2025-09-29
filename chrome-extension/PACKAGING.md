# Packaging the Burble Chrome Extension

This document explains how to package the Burble Chrome Extension for submission to the Chrome Web Store.

## Prerequisites

- Node.js and npm (for optional optimization steps)
- Chrome browser

## File Structure

The extension's file structure should look like this:

```
chrome-extension/
├── manifest.json
├── popup.html
├── popup.js
├── valentine.html
├── valentine.js
├── emoji.html
├── emoji.js
├── burble.html (optional)
├── burble.js (optional)
├── api.js
├── background.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
└── css/
    └── styles.css
```

## Packaging Steps

### 1. Convert SVG icons to PNG

Use a conversion tool or service to convert the SVG icons created in `store-assets` to PNG format:

- Convert `icon-16.svg` to `icons/icon16.png`
- Convert `icon-48.svg` to `icons/icon48.png`
- Convert `icon-128.svg` to `icons/icon128.png`

Inkscape, GIMP, or online conversion tools can be used for this purpose.

### 2. Update manifest.json

Ensure the manifest.json file includes all necessary icons:

```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

### 3. Verify all features

- Test all game modes
- Verify navigation between games
- Check that API connections work properly
- Ensure the "Open Full App" functionality redirects to the web application

### 4. Create ZIP package

#### Using command line:

```bash
cd chrome-extension/
zip -r burble-extension.zip . -x "*.svg" -x "store-assets/*" -x "*.md" -x ".*"
```

#### Manual method:

1. Open Chrome browser
2. Navigate to `chrome://extensions`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Pack extension" button
5. Browse to the chrome-extension directory
6. Click "Pack extension"

This will create a `.crx` file and a `.pem` key file. Keep the `.pem` file safe for future updates.

## Submit to Chrome Web Store

1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. Sign in with a Google account
3. Pay the one-time developer registration fee ($5 USD) if you haven't already
4. Click "New Item" button
5. Upload the ZIP file or .crx file
6. Fill in all required information:
   - Store listing information from `store-description.md`
   - Upload screenshots from `store-assets/screenshot-*.svg` (convert to PNG first)
   - Upload promotional tile images
   - Set privacy policy
   - Choose category and tags
7. Submit for review

## Post-Submission

The Chrome Web Store team will review your extension, which typically takes 1-5 business days. Once approved, your extension will be published on the Chrome Web Store.

## Additional Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Web Store Developer Guidelines](https://developer.chrome.com/docs/webstore/program_policies/)
- [Publishing to the Chrome Web Store](https://developer.chrome.com/docs/webstore/publish/)