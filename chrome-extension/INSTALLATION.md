# Burble Chrome Extension Installation Guide

You can install the Burble Brain Teasers Chrome Extension in two ways: from the Chrome Web Store (recommended) or in developer mode for testing.

## Method 1: Chrome Web Store Installation (Recommended)

1. Open the Chrome Web browser
2. Visit the [Burble Brain Teasers](https://chrome.google.com/webstore/detail/burble-brain-teasers) page on the Chrome Web Store
3. Click the "Add to Chrome" button
4. Confirm by clicking "Add extension" in the popup
5. The extension will download and install automatically
6. After installation, you'll see the Burble icon in your extensions toolbar (top-right of browser)
7. Click the icon to start playing

## Method 2: Developer Mode Installation (For Testing)

If the extension is not yet available on the Chrome Web Store or you want to test the latest development version, follow these steps:

### Prerequisites
- Google Chrome browser installed
- The chrome-extension folder with all necessary files

### Installation Steps

1. **Prepare the extension files**
   - Make sure you have all the required files in the `chrome-extension` folder
   - Convert SVG icons to PNG if necessary (follow the instructions in PACKAGING.md)

2. **Open Chrome's Extension Management page**
   - Open Chrome browser
   - Type `chrome://extensions` in the address bar and press Enter
   - Alternatively, click on the three dots menu (⋮) in the top-right corner, select "More tools" > "Extensions"

3. **Enable Developer Mode**
   - Look for the "Developer mode" toggle in the top-right corner of the extensions page
   - Turn it ON

4. **Load the unpacked extension**
   - Click the "Load unpacked" button that appears after enabling Developer mode
   - Browse to the location of the `chrome-extension` folder
   - Select the folder (not individual files) and click "Select Folder" or "Open"

5. **Verify installation**
   - The Burble extension should now appear in your list of extensions
   - You should see the Burble icon in your extensions toolbar
   - If you don't see the icon, click the puzzle piece icon in the toolbar and pin the Burble extension

6. **Using the extension**
   - Click on the Burble icon in your extensions toolbar to open the popup
   - Choose your preferred game mode and start playing!

## Troubleshooting

### Extension doesn't appear after installation
- Make sure you've enabled the extension in the extensions page
- Click the puzzle piece icon in the toolbar and check if Burble is listed
- Pin the extension by clicking the pin icon next to it

### Games don't load properly
- Check the console for errors (Right-click > Inspect > Console)
- Ensure your Chrome browser is up to date
- Try refreshing the page or restarting the browser

### Extension shows "Manifest Error"
- Make sure the manifest.json file is properly formatted
- Check for missing or incorrect icon paths
- Verify that all referenced files exist in the correct locations

### Connectivity issues with the main app
- Check if the API URL in api.js is correctly set
- Verify that the main web application is running and accessible

## Updates

If you installed through the Chrome Web Store, the extension will update automatically. If you're using Developer mode, you'll need to:

1. Download the latest version of the extension
2. Go to `chrome://extensions`
3. Find the Burble extension and click "Remove"
4. Follow the Developer Mode installation steps above with the new version

## Feedback and Support

If you encounter any issues or have suggestions for improvement, please:
- Report issues on our GitHub repository
- Contact support at support@burble-app.com
- Visit our website at https://burble-app.com for more information