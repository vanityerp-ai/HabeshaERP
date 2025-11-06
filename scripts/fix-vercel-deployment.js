#!/usr/bin/env node

/**
 * Script to fix Vercel deployment issues with React 19 and Storybook
 * 
 * This script helps resolve dependency conflicts by:
 * 1. Removing package-lock.json and node_modules
 * 2. Installing dependencies with --legacy-peer-deps
 * 3. Verifying the build
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Vercel Deployment Issues...');
console.log('=====================================');

try {
  // Step 1: Remove package-lock.json and node_modules
  console.log('1. Cleaning up existing dependencies...');
  
  if (fs.existsSync('package-lock.json')) {
    fs.unlinkSync('package-lock.json');
    console.log('   ✓ Removed package-lock.json');
  }
  
  if (fs.existsSync('node_modules')) {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
    console.log('   ✓ Removed node_modules directory');
  }
  
  // Step 2: Install with legacy peer deps
  console.log('2. Installing dependencies with --legacy-peer-deps...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  console.log('   ✓ Dependencies installed successfully');
  
  // Step 3: Verify build
  console.log('3. Verifying build...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('   ✓ Build completed successfully');
  
  console.log('\n✅ Vercel deployment fix completed!');
  console.log('Next steps:');
  console.log('1. Commit the updated package-lock.json:');
  console.log('   git add package-lock.json');
  console.log('   git commit -m "fix: update package-lock.json for Vercel deployment"');
  console.log('2. Push to trigger a new deployment:');
  console.log('   git push');
  console.log('3. In Vercel dashboard, redeploy with "Skip build cache" option checked');
  
} catch (error) {
  console.error('\n❌ Error during deployment fix:', error.message);
  process.exit(1);
}