#!/bin/bash
# Packaging script for Burble Chrome Extension
# This creates a ZIP file ready for submission to the Chrome Web Store

# Create icons directory if it doesn't exist
mkdir -p icons

# Create basic placeholder icons if they don't exist
# (You should replace these with your actual icons before submission)
if [ ! -f "icons/icon16.png" ]; then
  echo "Creating placeholder icon16.png"
  convert -size 16x16 xc:white -fill "#0071e3" -draw "rectangle 0,0 16,16" \
    -pointsize 10 -fill white -gravity center -annotate 0 "B" icons/icon16.png
fi

if [ ! -f "icons/icon48.png" ]; then
  echo "Creating placeholder icon48.png"
  convert -size 48x48 xc:white -fill "#0071e3" -draw "rectangle 0,0 48,48" \
    -pointsize 24 -fill white -gravity center -annotate 0 "B" icons/icon48.png
fi

if [ ! -f "icons/icon128.png" ]; then
  echo "Creating placeholder icon128.png"
  convert -size 128x128 xc:white -fill "#0071e3" -draw "rectangle 0,0 128,128" \
    -pointsize 64 -fill white -gravity center -annotate 0 "B" icons/icon128.png
fi

# Create store assets directory for submission assets
mkdir -p store-assets

# List of essential files to include
FILES=(
  "manifest.json"
  "popup.html"
  "popup.js"
  "valentine.html"
  "valentine.js"
  "emoji.html"
  "emoji.js"
  "burble.html"
  "burble.js"
  "burble.css"
  "background.js"
  "api.js"
  "mock-api.js"
  "styles.css"
  "icons/icon16.png"
  "icons/icon48.png"
  "icons/icon128.png"
)

# Create zip file
echo "Creating burble-extension.zip..."
zip -r burble-extension.zip "${FILES[@]}"

echo "Package created: burble-extension.zip"
echo "This file is ready for submission to the Chrome Web Store."