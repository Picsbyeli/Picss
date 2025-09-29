# Burble Chrome Extension

A Chrome browser extension for the Burble Brain Teasers game, featuring word puzzles, emoji riddles, and interactive brain teasers.

## Features

- **Multiple Game Modes**:
  - **Burble Word Game**: Guess hidden words with color-coded feedback
  - **Are You My Valentine?**: A modern take on Twenty Questions
  - **Emoji Guess**: Decode emoji combinations to guess the hidden word or phrase

- **Difficulty Levels**: Easy, Medium, Hard, and Extreme options
- **Offline Play**: All games work without an internet connection
- **Progress Tracking**: Local storage of scores and game history
- **Web App Integration**: Connect to the full Burble web application for more features

## Project Structure

```
chrome-extension/
├── manifest.json         # Extension configuration
├── popup.html            # Main extension popup
├── popup.js              # Script for main popup UI
├── valentine.html        # Valentine game page
├── valentine.js          # Valentine game logic
├── emoji.html            # Emoji Guess game page
├── emoji.js              # Emoji Guess game logic
├── api.js                # API communication module
├── background.js         # Extension background script
├── css/                  # CSS styles
│   └── styles.css        # Main stylesheet
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── store-assets/         # Chrome Web Store assets
│   ├── screenshot-1.svg
│   ├── screenshot-2.svg
│   ├── screenshot-3.svg
│   ├── promo-tile-small.svg
│   ├── promo-tile-large.svg
│   ├── icon-16.svg
│   ├── icon-48.svg
│   ├── icon-128.svg
│   ├── store-description.md
│   └── privacy-policy.md
├── package.sh            # Packaging script
├── PACKAGING.md          # Packaging instructions
├── INSTALLATION.md       # Installation guide
└── README.md             # This file
```

## Development

To develop and test this extension:

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked" and select the `chrome-extension` directory
5. Make changes to the code and refresh the extension as needed

## Building and Packaging

To package the extension for distribution:

1. Ensure all icons are converted from SVG to PNG format
2. Run the packaging script: `./package.sh`
3. Follow the submission steps in `PACKAGING.md`

## Usage

After installation:

1. Click the Burble icon in your Chrome toolbar
2. Select a game mode from the popup menu
3. Choose difficulty and category (where applicable)
4. Play and track your progress!

## Connect to Web App

The extension can connect to the full Burble web application:

1. Click "Open Full App" from any game screen
2. Log in to your Burble account (if prompted)
3. Your game progress will sync between the extension and web app

## Documentation

For more information, see:
- `INSTALLATION.md` for installation instructions
- `PACKAGING.md` for packaging and submission details

## Feedback and Support

For issues, suggestions, or feedback:
- Email: support@burble-app.com
- Visit: [burble-app.com](https://burble-app.com)
- GitHub: [github.com/burble/burble-extension](https://github.com/burble/burble-extension)

## License

© 2025 Burble Games. All rights reserved.