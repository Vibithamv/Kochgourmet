#!/usr/bin/env node

/**
 * Script to generate Android splash screen logos from the KOCHGOURMET app icon.
 * Creates splash screen logos in all required densities for Android
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceImage = path.join(__dirname, '../assets/images/kochgourmet-splash-icon.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');
const iosSplashPath = path.join(
  __dirname,
  '../ios/Kochgourmet/Images.xcassets/SplashScreenLegacy.imageset'
);

/** Must match constants/splash.ts and app.json expo-splash-screen imageWidth */
const SPLASH_ICON_SIZE = 200;

// Android splash bitmap sizes per density bucket (dp × multiplier)
const splashSizes = {
  'drawable-mdpi': SPLASH_ICON_SIZE,
  'drawable-hdpi': SPLASH_ICON_SIZE * 1.5,
  'drawable-xhdpi': SPLASH_ICON_SIZE * 2,
  'drawable-xxhdpi': SPLASH_ICON_SIZE * 3,
  'drawable-xxxhdpi': SPLASH_ICON_SIZE * 4,
};

function checkDependencies() {
  try {
    execSync('which sips', { stdio: 'ignore' });
    return 'sips';
  } catch (e) {
    console.error('Error: sips not found. This script requires macOS.');
    process.exit(1);
  }
}

function resizeImage(inputPath, outputPath, size) {
  try {
    execSync(`sips -z ${size} ${size} "${inputPath}" --out "${outputPath}"`, { stdio: 'inherit' });
    return outputPath;
  } catch (error) {
    console.error(`Error resizing image: ${error.message}`);
    throw error;
  }
}

const iosSplashSizes = {
  'image.png': SPLASH_ICON_SIZE,
  'image@2x.png': SPLASH_ICON_SIZE * 2,
  'image@3x.png': SPLASH_ICON_SIZE * 3,
};

function createIosSplashScreens() {
  console.log('🍎 Generating iOS splash screen images...\n');

  if (!fs.existsSync(iosSplashPath)) {
    console.warn(`⚠️  iOS splash folder not found: ${iosSplashPath}`);
    return;
  }

  for (const [filename, size] of Object.entries(iosSplashSizes)) {
    console.log(`📦 Creating iOS splash ${filename} (${size}x${size}px)...`);
    resizeImage(sourceImage, path.join(iosSplashPath, filename), size);
  }

  console.log('\n✅ iOS splash screen images generated successfully!');
}

function createSplashScreens() {
  console.log('🚀 Generating Android splash screen logos...\n');
  
  // Check if source image exists
  if (!fs.existsSync(sourceImage)) {
    console.error(`❌ Source image not found: ${sourceImage}`);
    process.exit(1);
  }
  
  checkDependencies();
  
  // Create splash screen logos for each density
  for (const [folder, size] of Object.entries(splashSizes)) {
    const folderPath = path.join(androidResPath, folder);
    
    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    console.log(`📦 Creating splash screen logo for ${folder} (${size}x${size}px)...`);
    
    // Create splash screen logo
    const splashLogo = path.join(folderPath, 'splashscreen_logo.png');
    resizeImage(sourceImage, splashLogo, size);
  }

  // Base drawable/ copy survives `androidRelease` cleanup (rm -rf drawable-*).
  const baseDrawablePath = path.join(androidResPath, 'drawable');
  if (!fs.existsSync(baseDrawablePath)) {
    fs.mkdirSync(baseDrawablePath, { recursive: true });
  }
  const baseSplashLogo = path.join(baseDrawablePath, 'splashscreen_logo.png');
  console.log(`📦 Creating base drawable splashscreen_logo (${splashSizes['drawable-xxhdpi']}x${splashSizes['drawable-xxhdpi']}px)...`);
  resizeImage(sourceImage, baseSplashLogo, splashSizes['drawable-xxhdpi']);
  
  console.log('\n✅ Android splash screen logos generated successfully!');
  createIosSplashScreens();
  console.log('\n📝 Splash screen configuration:');
  console.log('   - Light background: #FFF9F0 (white coral)');
  console.log('   - Dark background: #171311');
  console.log('   - Android logo: splashscreen_logo.png → splashscreen_icon.xml');
  console.log('   - iOS logo: SplashScreenLegacy.imageset');
  console.log('   - Rebuild native app after running this script (yarn android / yarn ios)');
}

// Run the script
createSplashScreens();


