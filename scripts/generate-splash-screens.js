#!/usr/bin/env node

/**
 * Script to generate Android splash screen logos from the KOCHGOURMET app icon.
 * Creates splash screen logos in all required densities for Android
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceImage = path.join(__dirname, '../assets/images/kochgourmet-app-icon.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

// Android splash screen logo sizes for different densities
// Splash screen logos are typically larger than launcher icons
const splashSizes = {
  'drawable-mdpi': 144,    // 1.5x base size
  'drawable-hdpi': 216,    // 2x base size
  'drawable-xhdpi': 288,   // 3x base size
  'drawable-xxhdpi': 432,  // 4x base size
  'drawable-xxxhdpi': 576, // 5x base size
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
  
  console.log('\n✅ Android splash screen logos generated successfully!');
  console.log('\n📝 Splash screen configuration:');
  console.log('   - Background color: #FFFFFF (white)');
  console.log('   - Logo: splashscreen_logo.png in each drawable folder');
  console.log('   - Configured in: android/app/src/main/res/values/styles.xml');
}

// Run the script
createSplashScreens();


