#!/bin/bash

# Fix malformed imports created by the batch converter

SRC_DIR="apps/mobile/src"

echo "🔧 Fixing malformed imports in React Native components..."

# Find all files with malformed imports (react';import pattern)
find "$SRC_DIR" -type f \( -name "*.tsx" -o -name "*.ts" \) | while IFS= read -r file; do
  # Skip backup files
  if [[ "$file" == *".OLD."* ]] || [[ "$file" == *".CONVERTED."* ]] || [[ "$file" == *".FIXED."* ]]; then
    continue
  fi

  # Check if file has malformed import
  if grep -q "from 'react';import {" "$file" || grep -q "from \"react\";import {" "$file"; then
    echo "  Fixing: $file"
    
    # Create a temp file
    temp_file="${file}.tmp"
    
    # Use Python to properly fix the imports
    python3 <<EOF
import re

with open('$file', 'r') as f:
    content = f.read()

# Fix pattern: import React from 'react';import { \n import { View... } from 'react-native';
# Should be:    import React from 'react';\n import { View... } from 'react-native';\n import {

# Pattern 1: react';import {  (with space or newline after)
content = re.sub(
    r"from ['\"]react['\"];import \{\s*\n",
    "from 'react';\n",
    content
)

# Pattern 2: react-native';  SOMETHING from '@expo...
content = re.sub(
    r"from ['\"]react-native['\"]\);(.+?)from ['\"]@expo",
    r"from 'react-native';\nimport { \1} from '@expo",
    content
)

# Save fixed content
with open('$temp_file', 'w') as f:
    f.write(content)
EOF
    
    # Replace original with fixed version
    mv "$temp_file" "$file"
  fi
done

echo "✅ Import fixes complete!"
