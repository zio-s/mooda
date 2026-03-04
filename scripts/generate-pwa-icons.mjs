/**
 * PWA 아이콘 생성 — SVG → PNG 변환 (sharp 사용)
 * 실행: node scripts/generate-pwa-icons.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'public', 'icons');
mkdirSync(ICONS_DIR, { recursive: true });

function makeSvg(size) {
  const r = size * 0.2;
  const fontSize = size * 0.5;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="central"
        font-size="${fontSize}" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">☕</text>
</svg>`;
}

const sizes = [192, 512];

for (const size of sizes) {
  const svg = Buffer.from(makeSvg(size));
  await sharp(svg).png().toFile(join(ICONS_DIR, `icon-${size}x${size}.png`));
  console.log(`✅ icon-${size}x${size}.png`);
}

// maskable icon (with padding)
function makeMaskableSvg(size) {
  const padding = size * 0.1;
  const innerSize = size - padding * 2;
  const fontSize = innerSize * 0.5;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="central"
        font-size="${fontSize}" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">☕</text>
</svg>`;
}

await sharp(Buffer.from(makeMaskableSvg(512))).png().toFile(join(ICONS_DIR, 'icon-maskable-512x512.png'));
console.log('✅ icon-maskable-512x512.png');
console.log('Done!');
