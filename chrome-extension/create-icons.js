/**
 * Create Placeholder Icons for Chrome Extension
 * 
 * This script creates simple placeholder icons for the Chrome extension.
 * It generates SVG files that are simple colored boxes with text.
 * 
 * To use this script:
 * 1. Make sure the icons/ directory exists
 * 2. Run with Node.js: node create-icons.js
 * 3. Convert the SVGs to PNGs using a tool like ImageMagick
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('Created icons directory');
}

// Create a placeholder icon
function createPlaceholderIcon(size, filename) {
  const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#8a2be2" rx="${size / 8}" ry="${size / 8}" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="${size / 3}">B</text>
</svg>`;

  const filepath = path.join(iconsDir, filename);
  fs.writeFileSync(filepath, svg);
  console.log(`Created ${filepath}`);
}

// Create each size of icon
createPlaceholderIcon(16, 'icon16.svg');
createPlaceholderIcon(32, 'icon32.svg');
createPlaceholderIcon(48, 'icon48.svg');
createPlaceholderIcon(128, 'icon128.svg');

console.log('Icons created! Convert them to PNG files using ImageMagick or another conversion tool.');
console.log('Example: convert icon16.svg icon16.png');