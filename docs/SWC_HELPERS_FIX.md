# @swc/helpers Module Resolution Error Fix

## Problem Description

Error: Module not found: Can't resolve '@swc/helpers/_/_interop_require_wildcard'

This error occurs when Next.js is unable to resolve the SWC (Speedy Web Compiler) helpers, which are essential for Next.js's compilation process. This typically happens due to:

1. Missing or corrupted @swc/helpers package
2. Inconsistent Next.js dependencies
3. Corrupted node_modules cache
4. Version mismatches between Next.js and its dependencies

## Root Causes

### 1. Missing @swc/helpers Package
The @swc/helpers package is a critical dependency for Next.js's compilation process but may not be properly installed.

### 2. Dependency Version Mismatches
Next.js requires specific versions of its dependencies to work correctly, and version mismatches can cause module resolution errors.

### 3. Corrupted Installation
The node_modules directory or package-lock.json may have become corrupted during installation.

## Solution

### Automated Fix Scripts

#### For Windows Users:
```bash
npm run fix:swc:windows
```

This script will:
1. Clean up all build artifacts (.next, node_modules, package-lock.json)
2. Configure .npmrc properly
3. Reinstall all dependencies
4. Explicitly install @swc/helpers
5. Verify installations

#### For All Platforms:
```bash
npm run fix:swc
```

This script performs the same steps as the Windows batch script but using Node.js.

### Manual Fix Steps

1. **Clean up the project:**
   ```bash
   # Remove build artifacts
   rm -rf .next
   rm -rf node_modules
   rm package-lock.json
   
   # On Windows, use:
   rd /s /q .next
   rd /s /q node_modules
   del package-lock.json
   ```

2. **Configure npm:**
   Create or update `.npmrc` with:
   ```
   legacy-peer-deps=true
   audit=false
   fund=false
   ```

3. **Reinstall dependencies:**
   ```bash
   npm install
   ```

4. **Install @swc/helpers explicitly:**
   ```bash
   npm install @swc/helpers --save-dev
   ```

5. **Verify installation:**
   ```bash
   npm list next @swc/helpers
   ```

6. **Test the development server:**
   ```bash
   npm run dev
   ```

## Prevention

### 1. Always Commit package-lock.json
Ensure package-lock.json is committed to version control to maintain consistent dependency versions across environments.

### 2. Use Consistent Node.js Versions
Make sure all team members and deployment environments use the same Node.js version.

### 3. Regular Cleanup
Periodically clean and reinstall dependencies:
```bash
npm run fix:swc
```

## Additional Troubleshooting

### Check for Conflicting Dependencies
```bash
npm ls next
npm ls @swc/helpers
```

If multiple versions appear, you may need to resolve conflicts by updating dependencies.

### Clear Next.js Cache
```bash
rm -rf .next
# On Windows:
rd /s /q .next
```

### Check Next.js Configuration
Ensure your `next.config.mjs` doesn't have conflicting settings:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your configuration
}

export default nextConfig
```

## Vercel Deployment

If deploying to Vercel, make sure to:
1. Commit the updated package-lock.json
2. Set environment variables in Vercel dashboard:
   - `NPM_CONFIG_LEGACY_PEER_DEPS=true`
   - `NODE_OPTIONS=--max-old-space-size=4096`

## Related Files

- [package.json](file:///C:/Users/Qhab/Desktop/VanityERP/package.json) - Project dependencies
- [next.config.mjs](file:///C:/Users/Qhab/Desktop/VanityERP/next.config.mjs) - Next.js configuration
- [.npmrc](file:///C:/Users/Qhab/Desktop/VanityERP/.npmrc) - npm configuration
- [scripts/fix-swc-helpers.js](file:///C:/Users/Qhab/Desktop/VanityERP/scripts/fix-swc-helpers.js) - Automated fix script
- [scripts/fix-swc-helpers.bat](file:///C:/Users/Qhab/Desktop/VanityERP/scripts/fix-swc-helpers.bat) - Windows batch fix script

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [SWC Documentation](https://swc.rs/)
- [npm Documentation](https://docs.npmjs.com/)
- [Vercel Deployment Documentation](https://vercel.com/docs)