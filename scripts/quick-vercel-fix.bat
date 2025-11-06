@echo off
echo 🔧 Quick Vercel Deployment Fix for React 19 + Storybook
echo =====================================================
echo.

echo 1. Cleaning up existing dependencies...
if exist package-lock.json del package-lock.json
if exist node_modules rd /s /q node_modules >nul 2>&1

echo 2. Installing dependencies with --legacy-peer-deps...
npm install --legacy-peer-deps

echo 3. Verifying build...
npm run build

echo.
echo ✅ Quick fix completed!
echo.
echo Next steps:
echo 1. Commit the updated package-lock.json:
echo    git add package-lock.json
echo    git commit -m "fix: update package-lock.json for Vercel deployment"
echo 2. Push to trigger a new deployment:
echo    git push
echo 3. In Vercel dashboard, redeploy with "Skip build cache" option checked
echo.
pause