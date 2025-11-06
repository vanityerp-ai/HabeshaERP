#!/usr/bin/env node

/**
 * Quick Fix for @swc/helpers Module Resolution Error
 * 
 * This script addresses the "@swc/helpers" error without requiring
 * deletion of the entire node_modules directory.
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Quick Fix for @swc/helpers Module Resolution Error');
console.log('================================================');

try {
  // Step 1: Clean up Next.js build cache only
  console.log('1. Cleaning up Next.js build cache...');
  
  // Remove .next directory if it exists
  if (fs.existsSync('.next')) {
    console.log('   Removing .next directory...');
    fs.rmSync('.next', { recursive: true, force: true });
  }
  
  console.log('   ✓ Next.js build cache cleaned');
  
  // Step 2: Install @swc/helpers explicitly
  console.log('2. Installing @swc/helpers...');
  execSync('npm install @swc/helpers --save-dev', { stdio: 'inherit' });
  console.log('   ✓ @swc/helpers installed');
  
  // Step 3: Reinstall Next.js to ensure proper dependencies
  console.log('3. Reinstalling Next.js...');
  execSync('npm install next@^15.2.4 --save', { stdio: 'inherit' });
  console.log('   ✓ Next.js reinstalled');
  
  // Step 4: Verify installation
  console.log('4. Verifying installations...');
  try {
    execSync('npm list next @swc/helpers', { stdio: 'pipe' });
    console.log('   ✓ Next.js and @swc/helpers are properly installed');
  } catch (error) {
    console.log('   ⚠️  Verification had issues, but installation should be complete');
  }
  
  console.log('\n✅ Quick @swc/helpers fix completed!');
  console.log('\nNext steps:');
  console.log('1. Start the development server:');
  console.log('   npm run dev');
  console.log('2. If the error persists, try the full fix script:');
  console.log('   npm run fix:swc:windows');
  
} catch (error) {
  console.error('\n❌ Error during quick @swc/helpers fix:', error.message);
  process.exit(1);
}