#!/usr/bin/env node
/**
 * Generates a mock visual of how the splash screen will look on a real
 * phone (1080x2400, the resolution of most modern Androids). Useful to
 * validate the visual identity before the APK is even built.
 *
 * Composition:
 *   - Full bleed Novicell purple background (#460032)
 *   - The icon (icon.png) centered vertically, scaled to ~30% of width
 *
 * Output: docs/preview-splash.png
 *
 * Usage:
 *   node scripts/preview-splash.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const NOVICELL_PURPLE = '#460032';
const PHONE_WIDTH = 1080;
const PHONE_HEIGHT = 2400;
const ICON_SIZE = Math.round(PHONE_WIDTH * 0.3); // 324px — matches Expo splash "contain"

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const DOCS_DIR = path.join(__dirname, '..', 'docs');

async function main() {
  const iconPath = path.join(ASSETS_DIR, 'icon.png');
  if (!fs.existsSync(iconPath)) {
    console.error('icon.png not found. Run scripts/generate-icons.js first.');
    process.exit(1);
  }

  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

  // Resize the existing icon to the size that the splash will render it at
  const iconBuffer = await sharp(iconPath)
    .resize(ICON_SIZE, ICON_SIZE)
    .toBuffer();

  // Compose: solid purple canvas + icon centered
  const top = Math.round((PHONE_HEIGHT - ICON_SIZE) / 2);
  const left = Math.round((PHONE_WIDTH - ICON_SIZE) / 2);

  await sharp({
    create: {
      width: PHONE_WIDTH,
      height: PHONE_HEIGHT,
      channels: 4,
      background: NOVICELL_PURPLE,
    },
  })
    .composite([{ input: iconBuffer, top, left }])
    .png()
    .toFile(path.join(DOCS_DIR, 'preview-splash.png'));

  console.log(`✓ docs/preview-splash.png (${PHONE_WIDTH}×${PHONE_HEIGHT})`);
}

main().catch((err) => {
  console.error('Failed to generate splash preview:', err);
  process.exit(1);
});
