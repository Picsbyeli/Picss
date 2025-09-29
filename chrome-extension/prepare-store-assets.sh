#!/bin/bash

# Burble Chrome Extension - Store Assets Preparation Script
# This script prepares all assets for Chrome Web Store submission

# Set variables
STORE_ASSETS_DIR="store-assets"
ICONS_DIR="icons"
SCREENSHOTS_DIR="screenshots"
OUTPUT_DIR="submission-package"

echo "Burble Chrome Extension - Store Assets Preparation"
echo "=================================================="
echo ""

# Make sure directories exist
mkdir -p "$ICONS_DIR"
mkdir -p "$SCREENSHOTS_DIR" 
mkdir -p "$OUTPUT_DIR"

# Check if required tools are installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is required but not installed."
  exit 1
fi

# Convert SVG icons to PNG
echo "Converting icons..."

# Check if we have the sharp module for Node.js
if ! node -e "require('sharp')" &> /dev/null; then
  echo "Installing sharp module for image conversion..."
  npm install --no-save sharp
fi

# Run the icon conversion
node convert-icons.js

if [ $? -ne 0 ]; then
  echo "Warning: Icon conversion failed. Make sure you have the 'sharp' module installed."
  echo "Try: npm install sharp"
  echo ""
else
  echo "Icons converted successfully!"
  echo ""
fi

# Copy screenshots and promotional images to submission package
echo "Copying store assets..."
cp -r "$STORE_ASSETS_DIR"/* "$OUTPUT_DIR"/ 2>/dev/null
cp -r "$ICONS_DIR"/* "$OUTPUT_DIR"/ 2>/dev/null

# Create a store submission text file with all descriptions
echo "Creating submission text file..."
cat > "$OUTPUT_DIR/store-submission.txt" << EOF
# Burble Chrome Extension - Store Submission Text

## Short Description (132 characters max)
$(grep -A 1 "## Short Description" "$STORE_ASSETS_DIR/store-description.md" | tail -n 1)

## Detailed Description
$(sed -n '/## Detailed Description/,/## Categories/p' "$STORE_ASSETS_DIR/store-description.md" | grep -v "## Categories" | grep -v "## Detailed Description")

## Categories
$(sed -n '/## Categories/,/## Tags/p' "$STORE_ASSETS_DIR/store-description.md" | grep -v "## Tags" | grep -v "## Categories")

## Tags
$(sed -n '/## Tags/,//p' "$STORE_ASSETS_DIR/store-description.md" | grep -v "## Tags")

## Privacy Policy
The full privacy policy is in privacy-policy.md - make sure to host this at a public URL
before submission and provide that URL in the store listing.
EOF

echo "Creating store submission checklist..."
cp SUBMISSION_CHECKLIST.md "$OUTPUT_DIR/checklist.md"

echo ""
echo "✓ Store assets preparation complete!"
echo ""
echo "Submission package created in: $OUTPUT_DIR"
echo ""
echo "Next steps:"
echo "1. Check all PNG images in the '$OUTPUT_DIR' directory"
echo "2. Review the store submission text in '$OUTPUT_DIR/store-submission.txt'"
echo "3. Publish your privacy policy to a public URL"
echo "4. Complete the checklist in '$OUTPUT_DIR/checklist.md'"
echo "5. Submit your extension using the files in '$OUTPUT_DIR'"
echo ""
echo "See PACKAGING.md for detailed submission instructions."