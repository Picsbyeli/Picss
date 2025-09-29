import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the current file's directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateScreenshots() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    defaultViewport: null,
  });

  try {
    const page = await browser.newPage();
    
    // Generate Small Promo Tile (440x280)
    console.log('Generating small promo tile...');
    const smallPromoPath = path.join(__dirname, 'small-promo.html');
    const smallPromoUrl = `file://${smallPromoPath}`;
    
    await page.setViewport({ width: 440, height: 280 });
    await page.goto(smallPromoUrl, { waitUntil: 'networkidle0' });
    await page.screenshot({ 
      path: path.join(__dirname, 'small-promo.png'),
      omitBackground: false
    });
    console.log('Small promo tile generated!');
    
    // Generate Marquee Promo Tile (1400x560)
    console.log('Generating marquee promo tile...');
    const marqueePromoPath = path.join(__dirname, 'marquee-promo.html');
    const marqueePromoUrl = `file://${marqueePromoPath}`;
    
    await page.setViewport({ width: 1400, height: 560 });
    await page.goto(marqueePromoUrl, { waitUntil: 'networkidle0' });
    await page.screenshot({ 
      path: path.join(__dirname, 'marquee-promo.png'),
      omitBackground: false
    });
    console.log('Marquee promo tile generated!');
    
    console.log('All promotional images have been generated!');
    console.log('Files created:');
    console.log('  - chrome-extension/store-assets/small-promo.png (440x280)');
    console.log('  - chrome-extension/store-assets/marquee-promo.png (1400x560)');
    
  } catch (error) {
    console.error('Error generating promotional images:', error);
  } finally {
    await browser.close();
  }
}

generateScreenshots();