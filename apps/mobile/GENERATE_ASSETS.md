# Generate App Assets (After Node.js Upgrade)

After upgrading Node.js to 20.19.4+, generate app assets:

## Method 1: Using Expo Template

```bash
cd /Users/pbechani/Code/projects/pribec

# Create temporary project to get default assets
npx create-expo-app@latest temp-assets --template blank-typescript

# Copy assets
cp temp-assets/assets/* apps/mobile/assets/

# Clean up
rm -rf temp-assets

# Customize icon later with design tool
```

## Method 2: Use Figma Export

If you have designs in Figma:
1. Export icon as 1024x1024 PNG → `apps/mobile/assets/icon.png`
2. Export splash as 1284x2778 PNG → `apps/mobile/assets/splash.png`

## Method 3: Online Icon Generator

1. Visit: https://www.appicon.co/ or https://easyappicon.com/
2. Upload logo or use text-based generator
3. Download iOS/Android icons
4. Place `icon.png` in `apps/mobile/assets/`

## Current Status

- ❌ `apps/mobile/assets/` is empty
- ⚠️ App will use Expo default icon until you add one
- ⚠️ This won't block functionality, just aesthetics

## Priority

**Low** - App will work without custom assets. Add later for production.
