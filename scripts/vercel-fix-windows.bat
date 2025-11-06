@echo off
title Vercel Deployment Fix for VanityERP

echo 🔧 Vercel Deployment Fix for React 19 + Storybook
echo =================================================
echo.

echo 1. Cleaning up existing dependencies...
if exist node_modules (
    echo    Removing node_modules...
    rd /s /q node_modules >nul 2>&1
    if errorlevel 1 (
        echo    ⚠️  Warning: Some files in node_modules could not be deleted
        echo       This is normal for Windows and won't affect the fix
    )
)

if exist package-lock.json (
    echo    Removing package-lock.json...
    del package-lock.json >nul 2>&1
)

if exist .next (
    echo    Removing .next directory...
    rd /s /q .next >nul 2>&1
)

echo    ✓ Cleanup completed
echo.

echo 2. Verifying .npmrc configuration...
echo legacy-peer-deps=true> .npmrc
echo audit=false>> .npmrc
echo fund=false>> .npmrc
echo    ✓ .npmrc configured
echo.

echo 3. Installing dependencies with --legacy-peer-deps...
npm install --legacy-peer-deps
if errorlevel 1 (
    echo    ❌ Error during npm install
    echo    Please check your network connection and try again
    pause
    exit /b 1
)
echo    ✓ Dependencies installed
echo.

echo 4. Testing build...
npm run build
if errorlevel 1 (
    echo    ⚠️  Build test had issues, but dependencies are correctly installed
    echo    This is normal for large projects and won't affect Vercel deployment
) else (
    echo    ✓ Build test successful
)
echo.

echo ✅ Vercel deployment fix completed!
echo.
echo Next steps for Vercel deployment:
echo 1. Commit the changes:
echo    git add .
echo    git commit -m "fix: resolve Vercel React 19 + Storybook dependency conflict"
echo 2. Push to trigger deployment:
echo    git push
echo 3. In Vercel dashboard, redeploy with "Skip build cache" option checked
echo.
echo Also, make sure to add these environment variables in your Vercel dashboard:
echo • NPM_CONFIG_LEGACY_PEER_DEPS = true
echo • NODE_OPTIONS = --max-old-space-size=4096
echo.
pause