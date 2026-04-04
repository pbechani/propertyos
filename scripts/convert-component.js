#!/usr/bin/env node

/**
 * PRIBEC Mobile - Web to React Native Component Converter
 * 
 * Converts a single web-based component file to React Native.
 * Usage: node scripts/convert-component.js <input-file> [output-file]
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = process.argv[2];
const OUTPUT_FILE = process.argv[3] || INPUT_FILE;

if (!INPUT_FILE) {
  console.error('❌ Usage: node scripts/convert-component.js <input-file> [output-file]');
  process.exit(1);
}

if (!fs.existsSync(INPUT_FILE)) {
  console.error(`❌ File not found: ${INPUT_FILE}`);
  process.exit(1);
}

console.log(`\n🔧 Converting ${INPUT_FILE}...`);

let content = fs.readFileSync(INPUT_FILE, 'utf-8');
let changes = [];

// 1. Replace motion/react imports
if (content.includes(`from 'motion/react'`) || content.includes(`from "motion/react"`)) {
  content = content.replace(/from ['"]motion\/react['"]/g, `from 'moti'`);
  content = content.replace(/{ motion }/g, `{ MotiView, MotiText, MotiScrollView }`);
  content = content.replace(/{ motion, /g, `{ MotiView, MotiText, MotiScrollView, `);
  content = content.replace(/, motion }/g, `, MotiView, MotiText, MotiScrollView }`);
  changes.push('✓ Replaced motion/react → moti');
}

// 2. Replace framer-motion imports
if (content.includes(`from 'framer-motion'`) || content.includes(`from "framer-motion"`)) {
  content = content.replace(/from ['"]framer-motion['"]/g, `from 'moti'`);
  changes.push('✓ Replaced framer-motion → moti');
}

// 3. Replace lucide-react imports
if (content.includes(`from 'lucide-react'`) || content.includes(`from "lucide-react"`)) {
  content = content.replace(/from ['"]lucide-react['"]/g, `from '@expo/vector-icons/Lucide'`);
  changes.push('✓ Replaced lucide-react → @expo/vector-icons/Lucide');
}

// 4. Add React Native imports if HTML elements detected
const htmlElements = /<(div|button|input|img|main|header|section|span|label|p|h[1-6])[\s>]/;
const hasReactNativeImport = /from ['"]react-native['"]/;
if (htmlElements.test(content) && !hasReactNativeImport.test(content)) {
  // Find the first import line to insert after
  const importReactMatch = content.match(/^import React.*$/m);
  if (importReactMatch) {
    const insertPos = importReactMatch.index + importReactMatch[0].length;
    const rnImport = `\nimport { View, Text, TouchableOpacity, TextInput, Image, ScrollView, StyleSheet, Dimensions } from 'react-native';`;
    content = content.slice(0, insertPos) + rnImport + content.slice(insertPos);
    changes.push('✓ Added React Native imports');
  }
}

// 5. Replace onClick with onPress
const onClickCount = (content.match(/ onClick=/g) || []).length;
if (onClickCount > 0) {
  content = content.replace(/ onClick=/g, ' onPress=');
  changes.push(`✓ Replaced ${onClickCount} onClick → onPress`);
}

// 6. Replace motion.div with MotiView
const motionDivCount = (content.match(/<motion\.div/g) || []).length;
if (motionDivCount > 0) {
  content = content.replace(/<motion\.div/g, '<MotiView');
  content = content.replace(/<\/motion\.div>/g, '</MotiView>');
  changes.push(`✓ Converted ${motionDivCount} motion.div → MotiView`);
}

// 7. Replace other motion elements
content = content.replace(/<motion\.p/g, '<MotiText');
content = content.replace(/<\/motion\.p>/g, '</MotiText>');
content = content.replace(/<motion\.span/g, '<MotiText');
content = content.replace(/<\/motion\.span>/g, '</MotiText>');
content = content.replace(/<motion\.section/g, '<MotiView');
content = content.replace(/<\/motion\.section>/g, '</MotiView>');
content = content.replace(/<motion\.header/g, '<MotiView');
content = content.replace(/<\/motion\.header>/g, '</MotiView>');

// 8. Add warning comment at top if HTML elements remain
if (htmlElements.test(content)) {
  const warning = `/**
 * ⚠️ WARNING: This component still contains HTML elements
 * 
 * Convert manually:
 * - <div> → <View>
 * - <button> → <TouchableOpacity>
 * - <p>, <span>, <h1-h6> → <Text>
 * - <img> → <Image>
 * - <input> → <TextInput>
 * 
 * See: apps/mobile/src/SplashScreen.FIXED.tsx for example
 */

`;
  content = warning + content;
  changes.push('⚠️  HTML elements remain - manual conversion needed');
}

// Write output
fs.writeFileSync(OUTPUT_FILE, content);

// Report
console.log(`\n✅ Conversion complete!\n`);
changes.forEach(c => console.log(`   ${c}`));
console.log(`\n📝 Output: ${OUTPUT_FILE}`);

if (htmlElements.test(content)) {
  console.log(`\n⚠️  Manual work needed: HTML elements still present`);
  console.log(`   Run: grep -n "<div\\|<button\\|<img" "${OUTPUT_FILE}"`);
}

console.log('');
