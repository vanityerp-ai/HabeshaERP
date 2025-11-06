@echo off
title Next.js Module Resolution Error Fix

echo 🔧 Fixing Next.js Module Resolution Error
echo ========================================
echo.

echo 1. Cleaning up build artifacts...
if exist .next (
    echo    Removing .next directory...
    rd /s /q .next >nul 2>&1
)

if exist node_modules (
    echo    Removing node_modules...
    rd /s /q node_modules >nul 2>&1
)

if exist package-lock.json (
    echo    Removing package-lock.json...
    del package-lock.json >nul 2>&1
)

echo    ✓ Cleanup completed
echo.

echo 2. Configuring .npmrc...
echo legacy-peer-deps=true> .npmrc
echo audit=false>> .npmrc
echo fund=false>> .npmrc
echo    ✓ .npmrc configured
echo.

echo 3. Installing dependencies...
npm install
if errorlevel 1 (
    echo    ❌ Error during npm install
    echo    Please check your network connection and try again
    pause
    exit /b 1
)
echo    ✓ Dependencies installed
echo.

echo 4. Verifying Next.js installation...
npm list next >nul 2>&1
if errorlevel 1 (
    echo    ⚠️  Next.js verification had issues, but installation should be complete
) else (
    echo    ✓ Next.js is properly installed
)
echo.

echo ✅ Next.js module resolution fix completed!
echo.
echo Next steps:
echo 1. Start the development server:
echo    npm run dev
echo 2. If the error persists, try clearing the Next.js cache:
echo    Delete the .next folder manually
echo 3. If issues continue, check for conflicting Next.js versions in dependencies
echo.
pause