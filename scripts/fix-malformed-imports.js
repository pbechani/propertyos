const fs = require('fs');
const path = require('path');
const glob = require('glob');

const SRC_DIR = 'apps/mobile/src';

console.log('🔧 Fixing malformed imports...\n');

// Find all TypeScript files
const files = glob.sync(`${SRC_DIR}/**/*.{ts,tsx}`, {
  ignore: ['**/*.OLD.*', '**/*.CONVERTED.*', '**/*.FIXED.*', '**/node_modules/**']
});

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // Fix pattern 1: import React from 'react';import {
  content = content.replace(
    /from ['"]react['"];import \{/g,
    "from 'react';\nimport {"
  );
  
  // Fix pattern 2: from 'react-native');  ICONS from '@expo
  content = content.replace(
    /from ['"]react-native['"]\);(.+?)from ['"]/g,
    "from 'react-native';\nimport { $1} from '"
  );
  
  // Fix pattern 3: Remove duplicate import { View... lines
  content = content.replace(
    /import \{ View, Text[^}]+\} from ['"]react-native['"];[\s\n]*import \{ View, Text[^}]+\} from ['"]react-native['"];/g,
    match => {
      // Keep only the first occurrence
      const lines = match.split('\n');
      return lines[0] + '\n';
    }
  );
  
  // Fix MotiView imports - motion should be removed, MotiView added
  if (content.includes("from 'moti'") && content.includes('motion.')) {
    content = content.replace(/import \{ ([^}]*?)motion([^}]*?)\} from ['"]moti['"];/g, (match, before, after) => {
      const imports = [before, after].join(',').split(',').map(s => s.trim()).filter(Boolean);
      const filtered = imports.filter(imp => imp !== 'motion' && !imp.startsWith('motion '));
      
      // Add MotiView if not present
      if (!filtered.includes('MotiView') && !filtered.some(imp => imp.includes('MotiView'))) {
        filtered.push('MotiView');
      }
      
      return `import { ${filtered.join(', ')} } from 'moti';`;
    });
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`  ✓ Fixed: ${file}`);
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
