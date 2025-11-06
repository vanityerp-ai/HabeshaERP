# Vercel Deployment Fix for React 19 + Storybook Dependency Conflict

## Problem

When deploying to Vercel, you may encounter the following error:

```
npm error While resolving: @storybook/addon-essentials@7.6.20
npm error Found: react@19.1.0
...
npm error Could not resolve dependency:
npm error peer react@"^16.8.0 || ^17.0.0 || ^18.0.0" from @storybook/addon-essentials@7.6.20
```

This occurs because Storybook v7.6.20 has peer dependencies that only support React versions up to 18, but the project uses React 19.1.0.

## Current Solution Status

The project has been updated to use Storybook v8.6.14, which supports React 19:

```json
"devDependencies": {
  "@storybook/addon-essentials": "^8.6.14",
  "@storybook/nextjs": "^8.6.14",
  "@storybook/react": "^8.6.14"
}
```

However, the deployment is still failing, indicating that Vercel might not be using the correct configuration.

## Enhanced Solution

### 1. Update Vercel Environment Variables

In your Vercel project settings, add these environment variables:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:
   - Key: `NPM_CONFIG_LEGACY_PEER_DEPS`, Value: `true`
   - Key: `NODE_OPTIONS`, Value: `--max-old-space-size=4096`

### 2. Enhanced vercel.json Configuration

Update your [vercel.json](file:///C:/Users/Qhab/Desktop/VanityERP/vercel.json) file with additional configurations:

```json
{
  "buildCommand": "npm install --legacy-peer-deps && npm run build",
  "installCommand": "npm install --legacy-peer-deps",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### 3. Force Rebuild with Cache Clear

To ensure Vercel uses the new configuration:

1. In your Vercel project dashboard, go to "Deployments"
2. Click on the three dots next to your latest deployment
3. Select "Redeploy"
4. Check "Skip build cache" before redeploying

### 4. Alternative package.json Approach

If the above doesn't work, add this to your [package.json](file:///C:/Users/Qhab/Desktop/VanityERP/package.json):

```json
{
  "engines": {
    "node": ">=18.0.0"
  },
  "overrides": {
    "@storybook/addon-essentials": "$@storybook/addon-essentials",
    "@storybook/nextjs": "$@storybook/nextjs",
    "@storybook/react": "$@storybook/react"
  }
}
```

### 5. Update .npmrc File

Ensure your [.npmrc](file:///C:/Users/Qhab/Desktop/VanityERP/.npmrc) file contains:

```
legacy-peer-deps=true
audit=false
fund=false
```

## Immediate Actions to Take

1. **Run the Vercel deployment fix script**:
   ```bash
   npm run fix:vercel:deploy
   ```
   This script will:
   - Clean up existing dependencies
   - Verify Storybook dependencies are correct
   - Configure .npmrc properly
   - Install dependencies with `--legacy-peer-deps`
   - Test the build

2. **Add the environment variables** in your Vercel dashboard as described above.

3. **Trigger a new deployment** with cache clearing.

## Verification

To verify the fix locally:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Build the project
npm run build
```

## Additional Notes

1. The `--legacy-peer-deps` flag tells npm to ignore peer dependency conflicts, which is safe for this specific case since Storybook v8.6.14 officially supports React 19.

2. If you continue to have issues, consider temporarily moving Storybook dependencies from `devDependencies` to `dependencies` in your [package.json](file:///C:/Users/Qhab/Desktop/VanityERP/package.json), as Vercel might not install devDependencies during the build process.

3. Always test your application after deployment to ensure all features work correctly.

## References

- [Storybook v8.6.14 Release Notes](https://github.com/storybookjs/storybook/releases/tag/v8.6.14)
- [React 19 Compatibility](https://react.dev/blog/2024/04/25/react-19)
- [Vercel Build Configuration](https://vercel.com/docs/projects/project-configuration)