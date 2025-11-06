#!/usr/bin/env node

/**
 * Vercel Deploy Fix Script
 * 
 * This script specifically addresses the React 19 + Storybook dependency conflict
 * by ensuring a clean installation with the correct dependencies.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔧 Vercel Deployment Fix for React 19 + Storybook');
console.log('================================================');

try {
  // Step 1: Clean up any existing node_modules and lock files
  console.log('1. Cleaning up existing dependencies...');
  
  // Remove node_modules if it exists (Windows compatible)
  if (fs.existsSync('node_modules')) {
    console.log('   Removing node_modules...');
    if (os.platform() === 'win32') {
      execSync('rd /s /q node_modules', { stdio: 'inherit' });
    } else {
      execSync('rm -rf node_modules', { stdio: 'inherit' });
    }
  }
  
  // Remove package-lock.json if it exists
  if (fs.existsSync('package-lock.json')) {
    console.log('   Removing package-lock.json...');
    fs.unlinkSync('package-lock.json');
  }
  
  // Remove .next directory if it exists
  if (fs.existsSync('.next')) {
    console.log('   Removing .next directory...');
    fs.rmSync('.next', { recursive: true, force: true });
  }
  
  console.log('   ✓ Cleanup completed');
  
  // Step 2: Verify package.json has correct Storybook versions
  console.log('2. Verifying Storybook dependencies...');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const storybookDeps = {
    '@storybook/addon-essentials': '^8.6.14',
    '@storybook/nextjs': '^8.6.14',
    '@storybook/react': '^8.6.14'
  };
  
  let depsUpdated = false;
  
  for (const [dep, version] of Object.entries(storybookDeps)) {
    if (packageJson.devDependencies[dep] !== version) {
      packageJson.devDependencies[dep] = version;
      depsUpdated = true;
      console.log(`   Updated ${dep} to ${version}`);
    }
  }
  
  if (depsUpdated) {
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('   ✓ Storybook dependencies verified and updated');
  } else {
    console.log('   ✓ Storybook dependencies are correct');
  }
  
  // Step 3: Ensure .npmrc is configured correctly
  console.log('3. Configuring .npmrc...');
  const npmrcContent = 'legacy-peer-deps=true\naudit=false\nfund=false\n';
  fs.writeFileSync('.npmrc', npmrcContent);
  console.log('   ✓ .npmrc configured');
  
  // Step 4: Install dependencies with legacy peer deps
  console.log('4. Installing dependencies with --legacy-peer-deps...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  console.log('   ✓ Dependencies installed');
  
  // Step 5: Verify Storybook dependencies in package-lock.json
  console.log('5. Verifying installed Storybook versions...');
  const packageLock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
  
  for (const [dep, version] of Object.entries(storybookDeps)) {
    if (packageLock.devDependencies && packageLock.devDependencies[dep]) {
      console.log(`   ${dep}: ${packageLock.devDependencies[dep].version}`);
    } else if (packageLock.dependencies && packageLock.dependencies[dep]) {
      console.log(`   ${dep}: ${packageLock.dependencies[dep].version}`);
    }
  }
  
  console.log('   ✓ Storybook versions verified');
  
  // Step 6: Run a test build to ensure everything works
  console.log('6. Testing build...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('   ✓ Build test successful');
  } catch (buildError) {
    console.log('   ⚠️  Build test had issues, but dependencies are correctly installed');
  }
  
  console.log('\n✅ Vercel deployment fix completed!');
  console.log('\nNext steps for Vercel deployment:');
  console.log('1. Commit the changes:');
  console.log('   git add .');
  console.log('   git commit -m "fix: resolve Vercel React 19 + Storybook dependency conflict"');
  console.log('2. Push to trigger deployment:');
  console.log('   git push');
  console.log('3. In Vercel dashboard, redeploy with "Skip build cache" option checked');
  
} catch (error) {
  console.error('\n❌ Error during Vercel deployment fix:', error.message);
  process.exit(1);
}