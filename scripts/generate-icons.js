import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');

// Create ProductionOS "P" icon with brand gradient
const createIconSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="iconGradient" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="50%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#D946EF"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.25}" fill="url(#iconGradient)"/>
  <text
    x="50%"
    y="55%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-weight="600"
    font-size="${size * 0.55}"
    fill="white"
  >P</text>
</svg>
`;

// Apple touch icon (180x180, no rounded corners for iOS)
const createAppleIconSvg = () => `
<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="iconGradient" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="50%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#D946EF"/>
    </linearGradient>
  </defs>
  <rect width="180" height="180" fill="url(#iconGradient)"/>
  <text
    x="50%"
    y="55%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-weight="600"
    font-size="100"
    fill="white"
  >P</text>
</svg>
`;

async function generateIcons() {
  console.log('Generating PWA icons...');

  // Generate 192x192 icon
  await sharp(Buffer.from(createIconSvg(192)))
    .png()
    .toFile(join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // Generate 512x512 icon
  await sharp(Buffer.from(createIconSvg(512)))
    .png()
    .toFile(join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // Generate apple-touch-icon (180x180, no rounded corners for iOS)
  await sharp(Buffer.from(createAppleIconSvg()))
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Generate favicon.ico (from 32x32 png)
  await sharp(Buffer.from(createIconSvg(32)))
    .png()
    .toFile(join(publicDir, 'favicon-32x32.png'));
  console.log('Created favicon-32x32.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
