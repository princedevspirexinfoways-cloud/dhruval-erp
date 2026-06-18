#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 * Generates all required PWA icons for different devices and platforms
 */

const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const iconSizes = [
  { size: 72, name: 'icon-72x72.png', purpose: 'maskable any' },
  { size: 96, name: 'icon-96x96.png', purpose: 'maskable any' },
  { size: 128, name: 'icon-128x128.png', purpose: 'maskable any' },
  { size: 144, name: 'icon-144x144.png', purpose: 'maskable any' },
  { size: 152, name: 'icon-152x152.png', purpose: 'maskable any' },
  { size: 192, name: 'icon-192x192.png', purpose: 'maskable any' },
  { size: 384, name: 'icon-384x384.png', purpose: 'maskable any' },
  { size: 512, name: 'icon-512x512.png', purpose: 'maskable any' },
  // Apple Touch Icons
  { size: 57, name: 'apple-touch-icon-57x57.png', purpose: 'any' },
  { size: 60, name: 'apple-touch-icon-60x60.png', purpose: 'any' },
  { size: 72, name: 'apple-touch-icon-72x72.png', purpose: 'any' },
  { size: 76, name: 'apple-touch-icon-76x76.png', purpose: 'any' },
  { size: 114, name: 'apple-touch-icon-114x114.png', purpose: 'any' },
  { size: 120, name: 'apple-touch-icon-120x120.png', purpose: 'any' },
  { size: 144, name: 'apple-touch-icon-144x144.png', purpose: 'any' },
  { size: 152, name: 'apple-touch-icon-152x152.png', purpose: 'any' },
  { size: 180, name: 'apple-touch-icon-180x180.png', purpose: 'any' },
  // Favicon
  { size: 16, name: 'favicon-16x16.png', purpose: 'any' },
  { size: 32, name: 'favicon-32x32.png', purpose: 'any' },
  { size: 48, name: 'favicon-48x48.png', purpose: 'any' },
];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icon template
function generateSVGIcon(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background Circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="url(#gradient)" stroke="#ffffff" stroke-width="2"/>
  
  <!-- ERP Text -->
  <text x="${size/2}" y="${size/2 + 8}" font-family="Arial, sans-serif" font-size="${size/8}" font-weight="bold" text-anchor="middle" fill="white">ERP</text>
  
  <!-- Decorative Elements -->
  <rect x="${size/4}" y="${size/4}" width="${size/8}" height="${size/8}" fill="white" opacity="0.8" rx="2"/>
  <rect x="${size*5/8}" y="${size/4}" width="${size/8}" height="${size/8}" fill="white" opacity="0.8" rx="2"/>
  <rect x="${size/4}" y="${size*5/8}" width="${size/8}" height="${size/8}" fill="white" opacity="0.8" rx="2"/>
  <rect x="${size*5/8}" y="${size*5/8}" width="${size/8}" height="${size/8}" fill="white" opacity="0.8" rx="2"/>
</svg>`;
}

// Generate HTML file to convert SVG to PNG (for manual conversion)
function generateHTMLConverter() {
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>PWA Icon Generator</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
        .icon-item { text-align: center; border: 1px solid #ddd; padding: 10px; border-radius: 8px; }
        .icon-item svg { max-width: 100px; max-height: 100px; }
        .download-btn { margin-top: 10px; padding: 5px 10px; background: #0ea5e9; color: white; border: none; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>ERP System PWA Icons</h1>
    <p>Right-click on each icon and "Save image as..." to download the PNG files.</p>
    
    <div class="icon-grid">
        ${iconSizes.map(icon => `
            <div class="icon-item">
                <h3>${icon.name}</h3>
                <div>${generateSVGIcon(icon.size)}</div>
                <p>Size: ${icon.size}x${icon.size}</p>
                <p>Purpose: ${icon.purpose}</p>
            </div>
        `).join('')}
    </div>

    <script>
        // Add download functionality
        document.querySelectorAll('svg').forEach((svg, index) => {
            const iconData = ${JSON.stringify(iconSizes)};
            const icon = iconData[index];
            
            svg.addEventListener('click', function() {
                const svgData = new XMLSerializer().serializeToString(svg);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                canvas.width = icon.size;
                canvas.height = icon.size;
                
                img.onload = function() {
                    ctx.drawImage(img, 0, 0);
                    const link = document.createElement('a');
                    link.download = icon.name;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                };
                
                img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
            });
        });
    </script>
</body>
</html>`;

  fs.writeFileSync(path.join(iconsDir, 'icon-generator.html'), html);
  console.log('✅ Generated icon-generator.html - Open this file in a browser to download PNG icons');
}

// Generate individual SVG files
iconSizes.forEach(icon => {
  const svgContent = generateSVGIcon(icon.size);
  const svgPath = path.join(iconsDir, icon.name.replace('.png', '.svg'));
  fs.writeFileSync(svgPath, svgContent);
});

// Generate the HTML converter
generateHTMLConverter();

console.log('✅ Generated SVG icons and HTML converter');
console.log(`📁 Icons directory: ${iconsDir}`);
console.log('🌐 Open icon-generator.html in your browser to convert SVG to PNG');
console.log('📱 All required PWA icon sizes have been generated');
