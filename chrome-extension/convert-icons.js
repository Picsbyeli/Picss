/**
 * SVG to PNG Conversion Utility
 * 
 * This script converts SVG files to PNG for use in the Chrome extension.
 * You'll need to install the 'sharp' package first with:
 * npm install sharp
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconsDir = path.join(__dirname, 'icons');

async function convertIcons() {
  try {
    // Check if icons directory exists
    if (!fs.existsSync(iconsDir)) {
      console.error('Icons directory not found. Run create-icons.js first.');
      process.exit(1);
    }

    const svgFiles = fs.readdirSync(iconsDir).filter(file => file.endsWith('.svg'));

    if (svgFiles.length === 0) {
      console.error('No SVG files found in the icons directory. Run create-icons.js first.');
      process.exit(1);
    }

    console.log('Converting SVG icons to PNG...');
    
    // Convert each SVG file to PNG
    for (const svgFile of svgFiles) {
      const svgPath = path.join(iconsDir, svgFile);
      const pngFile = svgFile.replace('.svg', '.png');
      const pngPath = path.join(iconsDir, pngFile);
      
      // Get the size from the filename (e.g., icon16.svg -> 16)
      const size = parseInt(svgFile.match(/\d+/)[0], 10);
      
      // Read SVG file
      const svgBuffer = fs.readFileSync(svgPath);
      
      // Convert to PNG
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      
      console.log(`Converted ${svgFile} to ${pngFile}`);
    }
    
    console.log('All SVG icons have been successfully converted to PNG.');
  } catch (error) {
    console.error('Error converting icons:', error);
    process.exit(1);
  }
}

convertIcons();