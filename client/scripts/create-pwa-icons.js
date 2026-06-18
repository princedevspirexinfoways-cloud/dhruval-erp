#!/usr/bin/env node

/**
 * Create PWA Icons using Canvas API
 * This script creates all required PWA icons programmatically
 */

const fs = require('fs');
const path = require('path');

// Check if we're in a browser environment (for the HTML version)
if (typeof window !== 'undefined') {
  // Browser version - use HTML5 Canvas
  createIconsInBrowser();
} else {
  // Node.js version - create SVG icons that can be converted
  createSVGIcons();
}

function createSVGIcons() {
  const iconSizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 72, name: 'icon-72x72.png' },
    { size: 96, name: 'icon-96x96.png' },
    { size: 128, name: 'icon-128x128.png' },
    { size: 144, name: 'icon-144x144.png' },
    { size: 152, name: 'icon-152x152.png' },
    { size: 192, name: 'icon-192x192.png' },
    { size: 384, name: 'icon-384x384.png' },
    { size: 512, name: 'icon-512x512.png' },
    { size: 57, name: 'apple-touch-icon-57x57.png' },
    { size: 60, name: 'apple-touch-icon-60x60.png' },
    { size: 76, name: 'apple-touch-icon-76x76.png' },
    { size: 114, name: 'apple-touch-icon-114x114.png' },
    { size: 120, name: 'apple-touch-icon-120x120.png' },
    { size: 180, name: 'apple-touch-icon-180x180.png' },
  ];

  const iconsDir = path.join(__dirname, '..', 'public', 'icons');

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('🎨 Creating SVG icons...');

  iconSizes.forEach(icon => {
    const svgContent = createSVGIcon(icon.size);
    const svgPath = path.join(iconsDir, icon.name.replace('.png', '.svg'));
    fs.writeFileSync(svgPath, svgContent);
    console.log(`✅ Created ${icon.name.replace('.png', '.svg')}`);
  });

  // Create a simple favicon.ico placeholder
  const faviconSVG = createSVGIcon(32);
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), faviconSVG);

  console.log('✅ Created favicon.svg');
  console.log('📝 To convert SVG to PNG, use an online converter or image editing software');
  console.log('🌐 Or open the HTML icon generator: public/icons/create-basic-icons.html');
}

function createSVGIcon(size) {
  const radius = size * 0.15;
  const fontSize = size / 5;
  const subtitleSize = size / 12;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="shine-${size}" x1="0%" y1="0%" x2="100%" y2="33%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
    </linearGradient>
  </defs>

  <!-- Background with rounded corners -->
  <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${radius}" ry="${radius}" fill="url(#gradient-${size})" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>

  <!-- Main ERP text -->
  <text x="${size/2}" y="${size/2 - size/20}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="white">ERP</text>

  <!-- Subtitle -->
  <text x="${size/2}" y="${size/2 + size/8}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${subtitleSize}" text-anchor="middle" fill="rgba(255,255,255,0.9)">SYSTEM</text>

  <!-- Geometric elements -->
  <rect x="${size/4 - size/16}" y="${size/6}" width="${size/8}" height="${size/32}" fill="rgba(255,255,255,0.6)"/>
  <rect x="${size*3/4 - size/16}" y="${size/6}" width="${size/8}" height="${size/32}" fill="rgba(255,255,255,0.6)"/>
  <rect x="${size/4 - size/16}" y="${size*5/6}" width="${size/8}" height="${size/32}" fill="rgba(255,255,255,0.6)"/>
  <rect x="${size*3/4 - size/16}" y="${size*5/6}" width="${size/8}" height="${size/32}" fill="rgba(255,255,255,0.6)"/>

  <!-- Shine effect -->
  <rect x="2" y="2" width="${size - 4}" height="${size/3}" rx="${radius}" ry="${radius}" fill="url(#shine-${size})"/>
</svg>`;
}

function createIconsInBrowser() {
  // This function would be used in the HTML file
  console.log('Use the HTML icon generator for browser-based icon creation');
}

// Run if called directly
if (require.main === module) {
  createSVGIcons();
}