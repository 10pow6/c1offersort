#!/bin/bash

# C1 Offers Sorter - Chrome Web Store Package Script
# This script builds the extension and packages it for Chrome Web Store submission

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR="releases"
ZIP_NAME="c1offers-v${VERSION}.zip"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}C1 Offers Sorter - Package Script${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Clean previous builds
echo -e "${YELLOW}[1/6]${NC} Cleaning previous builds..."
if [ -d "dist" ]; then
  rm -rf dist
  echo "✓ Removed dist/ directory"
fi

# Step 2: Run production build (includes .DS_Store cleanup)
echo ""
echo -e "${YELLOW}[2/5]${NC} Running production build..."
yarn build:prod
echo "✓ Production build complete"

# Step 3: Validate build
echo ""
echo -e "${YELLOW}[3/5]${NC} Validating build..."

# Check required files
REQUIRED_FILES=("dist/manifest.json" "dist/index.html" "dist/main.js" "dist/content.js")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    MISSING_FILES+=("$file")
  fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
  echo -e "${RED}✗ Missing required files:${NC}"
  for file in "${MISSING_FILES[@]}"; do
    echo -e "  ${RED}- $file${NC}"
  done
  exit 1
fi

# Check required icons
REQUIRED_ICONS=("dist/icons/icon16.png" "dist/icons/icon32.png" "dist/icons/icon48.png" "dist/icons/icon128.png")
MISSING_ICONS=()

for icon in "${REQUIRED_ICONS[@]}"; do
  if [ ! -f "$icon" ]; then
    MISSING_ICONS+=("$icon")
  fi
done

if [ ${#MISSING_ICONS[@]} -gt 0 ]; then
  echo -e "${RED}✗ Missing required icons:${NC}"
  for icon in "${MISSING_ICONS[@]}"; do
    echo -e "  ${RED}- $icon${NC}"
  done
  exit 1
fi

echo "✓ All required files present"

# Verify manifest version matches package.json
MANIFEST_VERSION=$(node -p "require('./dist/manifest.json').version")
if [ "$MANIFEST_VERSION" != "$VERSION" ]; then
  echo -e "${RED}✗ Version mismatch!${NC}"
  echo -e "  package.json: ${VERSION}"
  echo -e "  manifest.json: ${MANIFEST_VERSION}"
  exit 1
fi
echo "✓ Version numbers match (v${VERSION})"

# Calculate package size
DIST_SIZE=$(du -sh dist | cut -f1)
echo "✓ Package size: ${DIST_SIZE}"

# Step 4: Create zip file
echo ""
echo -e "${YELLOW}[4/5]${NC} Creating zip package..."

# Create releases directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Remove old zip if it exists
if [ -f "${OUTPUT_DIR}/${ZIP_NAME}" ]; then
  rm "${OUTPUT_DIR}/${ZIP_NAME}"
  echo "✓ Removed old package"
fi

# Create zip (excluding .DS_Store files just in case)
cd dist
zip -r "../${OUTPUT_DIR}/${ZIP_NAME}" . -x "*.DS_Store" > /dev/null
cd ..

ZIP_SIZE=$(du -sh "${OUTPUT_DIR}/${ZIP_NAME}" | cut -f1)
echo "✓ Created ${ZIP_NAME} (${ZIP_SIZE})"

# Also create a timestamped backup
BACKUP_ZIP_NAME="c1offers-v${VERSION}-${TIMESTAMP}.zip"
cp "${OUTPUT_DIR}/${ZIP_NAME}" "${OUTPUT_DIR}/${BACKUP_ZIP_NAME}"
echo "✓ Created backup: ${BACKUP_ZIP_NAME}"

# Step 5: Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Package created successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Package Details:${NC}"
echo -e "  Version:       ${VERSION}"
echo -e "  Package Size:  ${ZIP_SIZE}"
echo -e "  Location:      ${OUTPUT_DIR}/${ZIP_NAME}"
echo -e "  Backup:        ${OUTPUT_DIR}/${BACKUP_ZIP_NAME}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Upload ${ZIP_NAME} to Chrome Web Store"
echo -e "  2. Update store description if needed"
echo -e "  3. Add screenshots if features changed"
echo -e "  4. Submit for review"
echo ""
echo -e "${YELLOW}Checklist:${NC}"
echo -e "  □ PRIVACY.md committed to GitHub"
echo -e "  □ README.md reflects new features"
echo -e "  □ Screenshots updated (if needed)"
echo -e "  □ Git tag created: git tag v${VERSION}"
echo ""
