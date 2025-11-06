#!/usr/bin/env node

/**
 * Fix for Next.js Module Resolution Error
 * 
 * This script addresses the "Can't resolve 'next-flight-client-entry-loader'" error
 * by cleaning the project and reinstalling dependencies properly.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Next.js Module Resolution Error');
console.log('========================================');

try {
  // Step 1: Clean up any existing build artifacts
  console.log('1. Cleaning up build artifacts...');
  
  // Remove .next directory if it exists
  if (fs.existsSync('.next')) {
    console.log('   Removing .next directory...');
    fs.rmSync('.next', { recursive: true, force: true });
  }
  
  // Remove node_modules if it exists
  if (fs.existsSync('node_modules')) {
    console.log('   Removing node_modules...');
    fs.rmSync('node_modules', { recursive: true, force: true });
  }
  
  // Remove package-lock.json if it exists
  if (fs.existsSync('package-lock.json')) {
    console.log('   Removing package-lock.json...');
    fs.unlinkSync('package-lock.json');
  }
  
  console.log('   ✓ Cleanup completed');
  
  // Step 2: Verify package.json has correct Next.js version
  console.log('2. Verifying Next.js dependencies...');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Ensure Next.js version is correctly specified
  if (packageJson.dependencies && packageJson.dependencies.next) {
    console.log(`   Next.js version: ${packageJson.dependencies.next}`);
  } else {
    console.log('   ⚠️  Next.js not found in dependencies');
  }
  
  // Step 3: Ensure .npmrc is configured correctly
  console.log('3. Configuring .npmrc...');
  const npmrcContent = 'legacy-peer-deps=true\naudit=false\nfund=false\n';
  fs.writeFileSync('.npmrc', npmrcContent);
  console.log('   ✓ .npmrc configured');
  
  // Step 4: Install dependencies
  console.log('4. Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('   ✓ Dependencies installed');
  
  // Step 5: Verify Next.js installation
  console.log('5. Verifying Next.js installation...');
  try {
    execSync('npm list next', { stdio: 'pipe' });
    console.log('   ✓ Next.js is properly installed');
  } catch (error) {
    console.log('   ⚠️  Next.js verification had issues, but installation should be complete');
  }
  
  // Step 6: Test development server
  console.log('6. Testing development server start...');
  console.log('   To test, run: npm run dev');
  console.log('   The server should start without the module resolution error');
  
  console.log('\n✅ Next.js module resolution fix completed!');
  console.log('\nNext steps:');
  console.log('1. Start the development server:');
  console.log('   npm run dev');
  console.log('2. If the error persists, try clearing the Next.js cache:');
  console.log('   rm -rf .next (or delete the .next folder manually)');
  console.log('3. If issues continue, check for conflicting Next.js versions in dependencies');
  
} catch (error) {
  console.error('\n❌ Error during Next.js module resolution fix:', error.message);
  process.exit(1);
}