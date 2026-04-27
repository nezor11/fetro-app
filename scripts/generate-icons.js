#!/usr/bin/env node
/**
 * Generates placeholder icons for FetroApp from inline SVGs using sharp.
 *
 * The result is intentionally minimal — just the Novicell purple background
 * with a big white "F" centered. It is a placeholder until a designer
 * provides final branding. The benefit over the Expo default icons is that
 * the APK installed on a device will show a recognizable color and letter,
 * not the generic Expo splash screen.
 *
 * Usage:
 *   node scripts/generate-icons.js
 *
 * Outputs:
 *   - assets/icon.png                       1024x1024
 *   - assets/splash-icon.png                1024x1024
 *   - assets/android-icon-foreground.png    512x512   (purple "F" with transparent bg)
 *   - assets/android-icon-background.png    512x512   (solid Novicell purple)
 *   - assets/android-icon-monochrome.png    512x512   (white "F" on black for themed icons)
 *   - assets/favicon.png                    48x48
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const NOVICELL_PURPLE = '#460032';
const ASSETS_DIR = path.join(__dirname, '..', 'assets');

/**
 * Build an SVG with a centered "F" glyph. Customizable via opts.
 */
function buildIconSvg({
  size,
  bg,
  fg,
  letter = 'F',
  letterSize = 0.62, // proportion of size used for the letter glyph
}) {
  const fontSize = Math.round(size * letterSize);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${
    bg
      ? `<rect width="${size}" height="${size}" fill="${bg}"/>`
      : ''
  }
  <text
    x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    font-size="${fontSize}"
    font-weight="800"
    fill="${fg}"
  >${letter}</text>
</svg>`;
}

async function svgToPng(svg, size, outFile, { transparent = false } = {}) {
  const pipeline = sharp(Buffer.from(svg)).resize(size, size);

  if (transparent) {
    // No flatten — keep the alpha channel from the SVG (no background rect).
    await pipeline.png().toFile(outFile);
  } else {
    await pipeline.png().toFile(outFile);
  }
  console.log(`  ✓ ${path.basename(outFile)} (${size}×${size})`);
}

async function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  console.log(`Generating placeholder icons (Novicell purple ${NOVICELL_PURPLE})…`);

  // 1. icon.png — main app icon (purple bg + white F)
  await svgToPng(
    buildIconSvg({ size: 1024, bg: NOVICELL_PURPLE, fg: '#FFFFFF' }),
    1024,
    path.join(ASSETS_DIR, 'icon.png')
  );

  // 2. splash-icon.png — same look as icon, used by Expo splash
  await svgToPng(
    buildIconSvg({ size: 1024, bg: NOVICELL_PURPLE, fg: '#FFFFFF' }),
    1024,
    path.join(ASSETS_DIR, 'splash-icon.png')
  );

  // 3. android-icon-foreground.png — only the letter, transparent bg
  //    (Android composes background + foreground into the adaptive icon)
  await svgToPng(
    buildIconSvg({
      size: 512,
      bg: null,
      fg: '#FFFFFF',
      letterSize: 0.45, // smaller because of Android safe zone
    }),
    512,
    path.join(ASSETS_DIR, 'android-icon-foreground.png'),
    { transparent: true }
  );

  // 4. android-icon-background.png — solid purple, no glyph
  await svgToPng(
    `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${NOVICELL_PURPLE}"/>
</svg>`,
    512,
    path.join(ASSETS_DIR, 'android-icon-background.png')
  );

  // 5. android-icon-monochrome.png — single-color for Android 13+ themed
  //    icons (system tints it; we use white-on-transparent which Android
  //    reinterprets according to the user's theme).
  await svgToPng(
    buildIconSvg({
      size: 512,
      bg: null,
      fg: '#FFFFFF',
      letterSize: 0.45,
    }),
    512,
    path.join(ASSETS_DIR, 'android-icon-monochrome.png'),
    { transparent: true }
  );

  // 6. favicon.png — for the Expo web build
  await svgToPng(
    buildIconSvg({ size: 48, bg: NOVICELL_PURPLE, fg: '#FFFFFF' }),
    48,
    path.join(ASSETS_DIR, 'favicon.png')
  );

  console.log('Done.');
}

main().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
