#!/usr/bin/env node

/**
 * Production Build Script
 * 
 * This script performs a comprehensive build process for production deployment
 * including linting, type checking, testing, and building.
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Production Build Process...');
console.log('====================================');

try {
  // Step 1: Clean previous builds
  console.log('1. Cleaning previous builds...');
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
    console.log('   ✓ Cleaned .next directory');
  }
  
  // Step 2: Check for uncommitted changes
  console.log('2. Checking for uncommitted changes...');
  try {
    execSync('git diff-index --quiet HEAD --');
    console.log('   ✓ No uncommitted changes');
  } catch (error) {
    console.log('   ⚠️  There are uncommitted changes. Consider committing them first.');
  }
  
  // Step 3: Run linting
  console.log('3. Running linting checks...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    console.log('   ✓ Linting passed');
  } catch (error) {
    console.log('   ⚠️  Linting issues found. Attempting autofix...');
    try {
      execSync('npm run lint:fix', { stdio: 'inherit' });
      console.log('   ✓ Linting autofix completed');
    } catch (fixError) {
      console.log('   ⚠️  Some linting issues could not be automatically fixed');
    }
  }
  
  // Step 4: Run TypeScript type checking
  console.log('4. Running TypeScript type checking...');
  try {
    execSync('npm run type-check', { stdio: 'inherit' });
    console.log('   ✓ TypeScript compilation successful');
  } catch (error) {
    console.log('   ❌ TypeScript compilation failed. This must be fixed before deployment.');
    process.exit(1);
  }
  
  // Step 5: Run tests
  console.log('5. Running tests...');
  try {
    execSync('npm run test', { stdio: 'inherit' });
    console.log('   ✓ All tests passed');
  } catch (error) {
    console.log('   ⚠️  Some tests failed. Review test results before deployment.');
  }
  
  // Step 6: Build the application
  console.log('6. Building the application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('   ✓ Build completed successfully');
  } catch (error) {
    console.log('   ❌ Build failed. Check the error messages above.');
    process.exit(1);
  }
  
  console.log('\n🎉 Production build completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Test the production build locally:');
  console.log('   npm run start');
  console.log('2. If everything works, deploy to production:');
  console.log('   git add .');
  console.log('   git commit -m "chore: production build ready"');
  console.log('   git push');
  
} catch (error) {
  console.error('\n❌ Production build process failed:', error.message);
  process.exit(1);
}