#!/bin/bash

# PRIBEC Mobile - Web to React Native Converter
# This script automatically converts web-based components to React Native

set -e

echo "🔧 Converting web components to React Native..."
echo ""

SRC_DIR="apps/mobile/src"

# Step 1: Replace motion/react imports with moti
echo "📦 Step 1/6: Replacing Framer Motion with Moti..."
find "$SRC_DIR" -type f \( -name "*.tsx" -o -name "*.ts" \) -print0 | while IFS= read -r -d '' file; do
  if grep -q "from ['\"]motion/react['\"]" "$file"; then
    sed -i '' "s/from ['\"]motion\/react['\"]/from 'moti'/g" "$file"
    sed -i '' "s/{ motion }/{ MotiView, MotiText, MotiScrollView }/g" "$file"
    echo "  ✓ $file"
  fi
done

# Step 2: Replace lucide-react imports with @expo/vector-icons
echo ""
echo "📦 Step 2/6: Replacing lucide-react with @expo/vector-icons..."
find "$SRC_DIR" -type f \( -name "*.tsx" -o -name "*.ts" \) -print0 | while IFS= read -r -d '' file; do
  if grep -q "from ['\"]lucide-react['\"]" "$file"; then
    # Extract icon names from the import line
    IMPORT_LINE=$(grep "from ['\"]lucide-react['\"]" "$file")
    # Replace with @expo/vector-icons import
    sed -i '' "s/from ['\"]lucide-react['\"]/ from '@expo\/vector-icons\/Lucide'/g" "$file"
    echo "  ✓ $file"
  fi
done

# Step 3: Replace motion.div with MotiView
echo ""
echo "📦 Step 3/6: Converting motion components to Moti..."
find "$SRC_DIR" -type f -name "*.tsx" -print0 | while IFS= read -r -d '' file; do
  if grep -q "<motion\." "$file"; then
    sed -i '' 's/<motion\.div/<MotiView/g' "$file"
    sed -i '' 's/<\/motion\.div>/<\/MotiView>/g' "$file"
    sed -i '' 's/<motion\.p/<MotiText/g' "$file"
    sed -i '' 's/<\/motion\.p>/<\/MotiText>/g' "$file"
    sed -i '' 's/<motion\.span/<MotiText/g' "$file"
    sed -i '' 's/<\/motion\.span>/<\/MotiText>/g' "$file"
    echo "  ✓ $file"
  fi
done

# Step 4: Replace onClick with onPress
echo ""
echo "📦 Step 4/6: Converting onClick to onPress..."
find "$SRC_DIR" -type f -name "*.tsx" -print0 | while IFS= read -r -d '' file; do
  if grep -q " onClick=" "$file"; then
    sed -i '' 's/ onClick=/ onPress=/g' "$file"
    echo "  ✓ $file"
  fi
done

# Step 5: Add React Native imports where HTML elements are used
echo ""
echo "📦 Step 5/6: Adding React Native component imports..."
find "$SRC_DIR" -type f -name "*.tsx" -print0 | while IFS= read -r -d '' file; do
  # Check if file uses HTML elements but doesn't import from react-native
  if grep -qE '<(div|button|input|img|main|header|section|span|label|p|h1|h2|h3|h4|h5|h6)[ >]' "$file"; then
    if ! grep -q "from 'react-native'" "$file"; then
      # Add import after the React import
      if grep -q "^import React" "$file"; then
        sed -i '' "/^import React/a\\
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet } from 'react-native';" "$file"
        echo "  ✓ Added React Native imports to $file"
      fi
    fi
  fi
done

# Step 6: Create a report of remaining HTML elements
echo ""
echo "📦 Step 6/6: Scanning for remaining HTML elements..."
echo ""
echo "⚠️  Files still using HTML elements (need manual conversion):"
find "$SRC_DIR" -type f -name "*.tsx" -exec grep -l '<div\|<button\|<input\|<img\|<main\|<header\|<section\|<span\|<label\|<p\|<h[1-6]' {} \; | sed 's/^/  • /'

echo ""
echo "✅ Automated conversion complete!"
echo ""
echo "🔴 NEXT STEPS:"
echo "1. Manually convert HTML elements to React Native components"
echo "2. Replace <div> → <View>"
echo "3. Replace <button> → <TouchableOpacity>"
echo "4. Replace <img> → <Image>"
echo "5. Replace <input> → <TextInput>"
echo "6. Replace <p>, <span>, <h1-h6> → <Text>"
echo "7. Replace <main>, <header>, <section> → <View>"
echo ""
echo "📖 See MOBILE_APP_AUDIT.md for full guide"
