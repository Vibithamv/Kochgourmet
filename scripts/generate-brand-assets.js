#!/usr/bin/env node

/**
 * Rasterizes the Assetera wordmark SVG into every native bitmap the app needs:
 *
 *   assets/images/
 *     assetera-logo.png            - wordmark on transparent (Expo splash)
 *     assetera-app-icon.png        - 1024x1024 wordmark on dark square (Expo icon)
 *
 *   android/app/src/main/res/
 *     drawable/assetera_logo.png   - Android splash logo (single density, inset-scaled at runtime)
 *     mipmap-<density>/ic_launcher.png     - legacy launcher icon (5 densities, square dark + wordmark)
 *     mipmap-<density>/ic_launcher_round.png - legacy round launcher (same image, masked by OS)
 *     mipmap-<density>/ic_launcher_foreground.png - adaptive foreground (5 densities, transparent + wordmark)
 *
 *   ios/boltexponativewind/Images.xcassets/
 *     AppIcon.appiconset/App-Icon-1024x1024@1x.png      - iOS app icon (Xcode generates other sizes)
 *     SplashScreenLegacy.imageset/image{,@2x,@3x}.png   - iOS splash logo at 1x/2x/3x
 *
 * Source SVG: scripts/_assetera-wordmark.svg (matches components/AsseteraLogo.tsx).
 *
 * Re-run after editing the wordmark:
 *   node scripts/generate-brand-assets.js
 */

const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.join(__dirname, '..');
const SOURCE_SVG = path.join(__dirname, '_assetera-wordmark.svg');

const BRAND_YELLOW = '#E5CE45';
const ASSETERA_DARK_BG = '#151421';

function readWordmarkPaths() {
  const raw = fs.readFileSync(SOURCE_SVG, 'utf8');
  const paths = [...raw.matchAll(/<path\s+d="([^"]+)"\s+fill="currentColor"\s*\/?>/g)].map(
    (m) => `<path d="${m[1]}" fill="${BRAND_YELLOW}"/>`
  );
  if (paths.length === 0) throw new Error(`No paths found in ${SOURCE_SVG}`);
  return paths.join('');
}

function wordmarkTransparentSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 243 46" fill="none">${readWordmarkPaths()}</svg>`;
}

/** Square canvas: solid dark bg + wordmark scaled to fillRatio of width, centered. */
function squareSvg(size, fillRatio, withBackground) {
  const w = size * fillRatio;
  const h = w * (46 / 243);
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">`,
    withBackground ? `<rect width="${size}" height="${size}" fill="${ASSETERA_DARK_BG}"/>` : '',
    `<g transform="translate(${x} ${y}) scale(${w / 243})">${readWordmarkPaths()}</g>`,
    `</svg>`,
  ].join('');
}

function render(svgString, outputPath, fitWidth) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: fitWidth },
    background: 'rgba(0,0,0,0)',
  });
  const png = resvg.render().asPng();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, png);
  console.log(`  ${path.relative(ROOT, outputPath)}  (${(png.length / 1024).toFixed(1)} KB)`);
}

// ---------------------------------------------------------------------------
// 1. Expo-managed assets (referenced from app.json)
console.log('Expo assets:');
render(wordmarkTransparentSvg(), path.join(ROOT, 'assets/images/assetera-logo.png'), 1054);
render(squareSvg(1024, 0.74, true), path.join(ROOT, 'assets/images/assetera-app-icon.png'), 1024);

// ---------------------------------------------------------------------------
// 2. Android - single splash drawable (inset-scaled at runtime)
console.log('\nAndroid splash drawable:');
render(wordmarkTransparentSvg(), path.join(ROOT, 'android/app/src/main/res/drawable/assetera_logo.png'), 1054);

// ---------------------------------------------------------------------------
// 3. Android - mipmap launcher icons (5 densities, 3 variants each)
const ANDROID_DENSITIES = [
  { dir: 'mipmap-mdpi',    legacy: 48,  foreground: 108 },
  { dir: 'mipmap-hdpi',    legacy: 72,  foreground: 162 },
  { dir: 'mipmap-xhdpi',   legacy: 96,  foreground: 216 },
  { dir: 'mipmap-xxhdpi',  legacy: 144, foreground: 324 },
  { dir: 'mipmap-xxxhdpi', legacy: 192, foreground: 432 },
];

console.log('\nAndroid launcher icons:');
for (const { dir, legacy, foreground } of ANDROID_DENSITIES) {
  const base = path.join(ROOT, 'android/app/src/main/res', dir);
  // Legacy: full square dark bg + wordmark
  const legacySvg = squareSvg(legacy, 0.74, true);
  render(legacySvg, path.join(base, 'ic_launcher.png'), legacy);
  render(legacySvg, path.join(base, 'ic_launcher_round.png'), legacy);
  // Adaptive foreground: transparent + wordmark scaled to fit 66% safe zone of foreground tile
  // (safe zone ≈ 66% of foreground size, so wordmark fills 66% * 0.74 ≈ 49% of foreground)
  const fgSvg = squareSvg(foreground, 0.49, false);
  render(fgSvg, path.join(base, 'ic_launcher_foreground.png'), foreground);
}

// ---------------------------------------------------------------------------
// 4. iOS - app icon (single 1024 file, Xcode generates the rest)
console.log('\niOS app icon:');
render(
  squareSvg(1024, 0.74, true),
  path.join(ROOT, 'ios/boltexponativewind/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png'),
  1024
);

// ---------------------------------------------------------------------------
// 5. iOS - splash logo at 1x / 2x / 3x
console.log('\niOS splash:');
const SPLASH_BASE_WIDTH = 200; // logical pt width
const splashSet = path.join(ROOT, 'ios/boltexponativewind/Images.xcassets/SplashScreenLegacy.imageset');
render(wordmarkTransparentSvg(), path.join(splashSet, 'image.png'),    SPLASH_BASE_WIDTH * 1);
render(wordmarkTransparentSvg(), path.join(splashSet, 'image@2x.png'), SPLASH_BASE_WIDTH * 2);
render(wordmarkTransparentSvg(), path.join(splashSet, 'image@3x.png'), SPLASH_BASE_WIDTH * 3);

console.log('\ndone.');
