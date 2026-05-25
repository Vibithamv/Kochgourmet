#!/usr/bin/env node

/**
 * Script to generate Android launcher icons from the Assetera app icon.
 * Creates icons in all required densities for Android
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceImage = path.join(__dirname, '../assets/images/assetera-app-icon.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

// Android icon sizes for different densities
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// For adaptive icons, foreground should be larger (safe area is 66% of total)
const adaptiveIconSizes = {
  'mipmap-mdpi': 108,    // 72px safe area
  'mipmap-hdpi': 162,     // 108px safe area
  'mipmap-xhdpi': 216,    // 144px safe area
  'mipmap-xxhdpi': 324,   // 216px safe area
  'mipmap-xxxhdpi': 432,  // 288px safe area
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

function resizeImage(inputPath, outputPath, size, format = 'png') {
  try {
    if (format === 'webp') {
      // First resize to PNG, then convert to webp if cwebp is available
      const tempPng = outputPath.replace('.webp', '_temp.png');
      execSync(`sips -z ${size} ${size} "${inputPath}" --out "${tempPng}"`, { stdio: 'inherit' });
      
      // Try to convert to webp
      try {
        execSync(`cwebp -q 90 "${tempPng}" -o "${outputPath}"`, { stdio: 'inherit' });
        fs.unlinkSync(tempPng);
      } catch (e) {
        // If cwebp not available, keep as PNG
        console.warn(`cwebp not found. Keeping as PNG. Install webp tools: brew install webp`);
        fs.renameSync(tempPng, outputPath.replace('.webp', '.png'));
        return outputPath.replace('.webp', '.png');
      }
    } else {
      execSync(`sips -z ${size} ${size} "${inputPath}" --out "${outputPath}"`, { stdio: 'inherit' });
    }
    return outputPath;
  } catch (error) {
    console.error(`Error resizing image: ${error.message}`);
    throw error;
  }
}

function createIcons() {
  console.log('🚀 Generating Android launcher icons...\n');
  
  // Check if source image exists
  if (!fs.existsSync(sourceImage)) {
    console.error(`❌ Source image not found: ${sourceImage}`);
    process.exit(1);
  }
  
  checkDependencies();
  
  // Create icons for each density
  for (const [folder, size] of Object.entries(iconSizes)) {
    const folderPath = path.join(androidResPath, folder);
    
    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    console.log(`📦 Creating icons for ${folder} (${size}x${size}px)...`);
    
    // Create regular launcher icon
    const launcherIcon = path.join(folderPath, 'ic_launcher.webp');
    resizeImage(sourceImage, launcherIcon, size, 'webp');
    
    // Create round launcher icon (same as regular for now)
    const roundIcon = path.join(folderPath, 'ic_launcher_round.webp');
    resizeImage(sourceImage, roundIcon, size, 'webp');
    
    // Create foreground for adaptive icon (larger size)
    const adaptiveSize = adaptiveIconSizes[folder];
    const foregroundIcon = path.join(folderPath, 'ic_launcher_foreground.webp');
    resizeImage(sourceImage, foregroundIcon, adaptiveSize, 'webp');
  }
  
  console.log('\n✅ Android launcher icons generated successfully!');
  console.log('\n📝 Note: If webp conversion failed, icons were created as PNG.');
  console.log('   Install webp tools: brew install webp');
}

// Run the script
createIcons();


