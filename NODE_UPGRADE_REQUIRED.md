# Expo SDK 54 Upgrade - BLOCKED BY NODE.JS VERSION

## 🚨 CRITICAL BLOCKER

**The upgrade CANNOT proceed without upgrading Node.js first.**

Current: Node.js 20.18.3
Required: Node.js >= 20.19.4

npm is automatically downgrading ALL dependencies to SDK 51 versions because your Node.js version doesn't meet the engine requirements.

---

## What's Happening

When you run `npm install`, npm sees that react-native@0.81.5 requires Node >= 20.19.4. Since you have 20.18.3, npm ignores your package.json and installs whatever versions work with your Node version.

**Result:** You're still on Expo SDK 51 despite the package.json showing SDK 54.

### Evidence (from `npm ls`):

| Package | package.json | Installed | Status |
|---------|--------------|-----------|--------|
| react-native | 0.81.5 | 0.74.5 | INVALID |
| expo | ~54.0.0 | 54.0.33 | OK |
| @react-native-async-storage | 2.2.0 | 1.23.1 | INVALID |
| react-native-gesture-handler | ~2.28.0 | 2.16.2 | INVALID |
| react-native-reanimated | ~3.17.4 | 3.10.1 | INVALID |
| react-native-screens | ~4.16.0 | 3.31.1 | INVALID |
| react-native-safe-area-context | ~5.6.0 | 4.10.5 | INVALID |
| nativewind | 4.2.3 | 4.2.3 | OK |

---

## Required Action

### Step 1: Upgrade Node.js

```bash
# Using nvm (recommended)
nvm install 20.19.4
nvm use 20.19.4
nvm alias default 20.19.4

# Verify
node --version  # MUST show v20.19.4 or higher
```

### Step 2: Clean Reinstall

```bash
cd /Users/pbechani/Code/projects/pribec

# Remove all node_modules and lock files
rm -rf node_modules package-lock.json
find apps packages -name node_modules -type d -exec rm -rf {} + 2>/dev/null || true

# Fresh install
npm install

# Verify versions
npm ls react-native
# Should show: react-native@0.81.5 (not 0.74.5)
```

### Step 3: Start Dev Server

```bash
npm run start --workspace=pribec-mobile
```

---

## Why This Is Required

1. **Metro Bundler:** Metro 0.83.x has a **hard requirement** of Node >= 20.19.4
2. **React Native 0.81:** Explicitly requires Node >= 20.19.4
3. **npm Behavior:** npm automatically downgrades packages when engine requirements aren't met
4. **No Workaround:** There is no way to bypass this without upgrading Node

---

## Files Already Prepared for SDK 54

✅ `apps/mobile/package.json` - All SDK 54 versions specified
✅ `.nvmrc` - Updated to 20.19.4
✅ `.npmrc` - Configured for compatibility
✅ `package.json` (root) - Metro overrides removed, versions pinned

**Once you upgrade Node.js, a simple `npm install` will correctly install all SDK 54 dependencies.**

---

## Alternative: Rollback to SDK 51

If you can't upgrade Node.js right now:

```bash
git checkout apps/mobile/package.json package.json .nvmrc .npmrc
npm install
```

This will restore the SDK 51 environment that works with Node 20.18.3.

---

## What I've Done

1. ✅ Updated all package.json files to SDK 54 specifications
2. ✅ Fixed Metro bundler conflicts
3. ✅ Upgraded NativeWind to 4.2.3 for SDK 54 compatibility
4. ✅ Configured React 18.3.1 for React Navigation 6.x compatibility
5. ✅ Updated `.nvmrc` to 20.19.4
6. ✅ Simplified `.npmrc` configuration
7. ✅ Added React/React Native to root for monorepo compatibility
8. ⏸️ **BLOCKED:** Waiting for Node.js upgrade to complete installation

---

## Expected Outcome After Node Upgrade

After upgrading Node and running `npm install`:
- ✅ All packages will install at correct SDK 54 versions
- ✅ `npm ls react-native` will show 0.81.5
- ✅ Metro bundler will load correctly
- ✅ Expo dev server will start
- ⚠️ TypeScript errors will remain (separate fix needed)

---

## Next Steps

**Your terminal command:**

```bash
nvm install 20.19.4 && nvm use 20.19.4 && rm -rf node_modules && npm install
```

Then test with:

```bash
npm run start --workspace=pribec-mobile
```

---

## Support

If you encounter issues after Node upgrade, the full upgrade guide is in:
`/Users/pbechani/Code/projects/pribec/UPGRADE_SDK_54.md`
