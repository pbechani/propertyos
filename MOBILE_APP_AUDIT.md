# PRIBEC Mobile App - Critical Issues Report

## 🔴 IMMEDIATE BLOCKERS

### Issue #1: Node.js Version Mismatch (BLOCKING EVERYTHING)

**Current:** Node.js 20.18.3
**Required:** Node.js >= 20.19.4

**Impact:**
- npm installs wrong versions (SDK 51 instead of SDK 54)
- Creates duplicate React/React Native installations
- Causes TurboModule incompatibility error in Expo Go 54

**Evidence:**
```bash
$ npm ls react-native
react-native@0.74.5 (SDK 51) ❌ Expected: 0.81.5 (SDK 54)
```

**Fix:**
```bash
nvm install 20.19.4
nvm use 20.19.4
cd /Users/pbechani/Code/projects/pribec
rm -rf node_modules
npm install
```

---

### Issue #2: Web Code in React Native App (ARCHITECTURAL)

**53 out of 54 component files use WEB-ONLY libraries:**

| Web Library | Files Affected | React Native Alternative |
|-------------|----------------|--------------------------|
| `motion/react` (Framer Motion) | 52 files | `moti` or `Animated` API |
| `lucide-react` (Web icons) | 53 files | `@expo/vector-icons` |
| HTML elements (`<div>`, `<button>`) | All files | `View`, `TouchableOpacity` |
| `onClick` events | All files | `onPress` |

**Example from SplashScreen.tsx:**

```tsx
// ❌ WEB CODE (Won't work in React Native)
import { motion } from 'motion/react';
import { DraftingCompass } from 'lucide-react';

<main className="...">
  <div className="...">
    <img src="..." />
    <button onClick={() => ...}>Click</button>
  </div>
</main>

// ✅ REACT NATIVE CODE (Correct)
import { Animated } from 'react-native';
import { DraftingCompass } from '@expo/vector-icons/Lucide';

<View style={...}>
  <View style={...}>
    <Image source={{ uri: "..." }} />
    <TouchableOpacity onPress={() => ...}>
      <Text>Click</Text>
    </TouchableOpacity>
  </View>
</View>
```

**How This Happened:**

Looking at your codebase, it appears these components were initially built for the web app (`apps/web`) and copied to the mobile app (`apps/mobile`) without proper conversion to React Native primitives.

You have a compatibility shim (`src/components/compat/dom.tsx`) that maps HTML elements to React Native, but:
- ❌ No components are importing from it
- ❌ Doesn't handle `motion/react` or `lucide-react`
- ❌ Would need to be used in every component

---

## 📊 Full Audit Results

### ✅ What's Working

1. **Project Structure** - Properly organized
2. **Navigation Setup** - React Navigation correctly configured
3. **Auth Context** - Well-implemented with JWT handling
4. **Entry Point** - Valid (`index.js` → `src/App.tsx`)
5. **Configuration Files** - Babel, Metro, app.json all correct
6. **NativeWind** - Properly installed (v4.2.3)
7. **TypeScript** - Configuration valid

### ❌ What's Broken

1. **Node.js Version** (20.18.3 vs required 20.19.4+)
2. **Wrong Package Versions** (SDK 51 installed, SDK 54 needed)
3. **Web-Only Code** in all 53 component files
4. **Missing Assets** (`assets/icon.png`, `assets/splash.png`)
5. **Unused Compatibility Shim** (`compat/dom.tsx` exists but not imported)

### ⚠️ What's Incomplete

1. **Moti vs Framer Motion** - Have `moti` installed but using `motion/react`
2. **Icon Libraries** - Have `@expo/vector-icons` but using `lucide-react`
3. **Asset Generation** - No icon/splash images generated

---

## 🎯 RECOMMENDED FIX STRATEGY

### Phase 1: Fix Environment (MUST DO FIRST)

**Upgrade Node.js to 20.19.4+**

This fixes:
- ✅ Duplicate React installations
- ✅ Wrong package versions
- ✅ TurboModule error
- ✅ Metro bundler compatibility

Time: **5 minutes**
Difficulty: **Easy**

---

### Phase 2: Fix Web Code (MUST DO FOR APP TO WORK)

After Phase 1, your app will bundle successfully but crash immediately because of web-only code.

**You have 3 options:**

#### Option A: Use the Web App for Now
Keep using `apps/web` (Next.js) which already works. Mobile app requires complete rewrite.

#### Option B: Quick Fix with Compat Layer
Update all 53 files to use the `compat/dom.tsx` shim and replace web libraries:

```tsx
// Replace in EVERY file
- import { motion } from 'motion/react'
+ import { MotiView as motion } from 'moti'

- import { Icon } from 'lucide-react'
+ import { Icon } from '@expo/vector-icons/Lucide'

// Add at top of each file that uses HTML elements
+ import { Div, Button, P, Img, Main } from '../compat/dom'
```

Time: **8-12 hours** (automated script recommended)
Difficulty: **Medium**

#### Option C: Proper React Native Rewrite
Rewrite all components using proper React Native primitives:
- `View`, `Text`, `TouchableOpacity`, `Image`
- `Animated` API or Reanimated
- `@expo/vector-icons`
- `onPress` instead of `onClick`

Time: **40-80 hours**
Difficulty: **High**

---

## 🔧 What I've Fixed

1. ✅ Added `.expo/` to `.gitignore`
2. ✅ Updated `app.json` splash configuration
3. ✅ Documented all issues comprehensively
4. ✅ Prepared package.json files for SDK 54 (waiting on Node.js upgrade)

---

## 📝 DECISION MATRIX

| Scenario | Action | Timeline | Outcome |
|----------|--------|----------|---------|
| **Want SDK 54 NOW** | Upgrade Node.js | 5 min | TurboModule fixed, but web code still broken |
| **Want working app NOW** | Use `apps/web` | 0 min | Web app works fine |
| **Want mobile app fixed** | Option B (compat layer) | 12 hours | Basic mobile functionality |
| **Want proper mobile app** | Option C (full rewrite) | 80 hours | Production-ready |

---

## 🎬 IMMEDIATE NEXT STEPS

**Step 1: Upgrade Node.js (Required for ANY mobile work)**

```bash
nvm install 20.19.4
nvm use 20.19.4
node --version  # Verify

cd /Users/pbechani/Code/projects/pribec
rm -rf node_modules
npm install

npm run start --workspace=pribec-mobile
```

**Step 2: Decide on Mobile Strategy**

After Node upgrade, the app will bundle but crash on launch due to web code. You'll need to choose Option A, B, or C above.

---

## 📞 RECOMMENDATION

Given the scope of web code in your mobile app (53/54 files), I recommend:

1. **Short-term:** Use `apps/web` (Next.js) for your MVP - it's already working
2. **Medium-term:** Create a proper React Native mobile app from scratch using the web app as a reference
3. **Reason:** Converting 53 files from web → React Native will take longer and be more error-prone than building clean RN components

The web app can be made mobile-responsive while you build a proper native mobile app in parallel.

---

## Files Modified

- ✅ `.gitignore` - Added `.expo/`
- ✅ `app.json` - Fixed splash reference
- ✅ `MOBILE_APP_AUDIT.md` - This comprehensive audit
- ✅ `NODE_UPGRADE_REQUIRED.md` - Node.js upgrade guide

