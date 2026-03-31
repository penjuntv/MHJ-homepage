/**
 * PWA icon generator — MHJ brand
 * Uses @napi-rs/canvas for accurate text centering
 * Generates: icon-192.png, icon-512.png, apple-touch-icon.png, favicon.ico (32x32)
 */
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const BRAND_BROWN = '#8A6B4F';
const WHITE = '#FFFFFF';

function drawIcon(size, text, fontSize) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Brown circle background
  ctx.fillStyle = BRAND_BROWN;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // White text — center precisely using measureText
  ctx.fillStyle = WHITE;
  ctx.font = `400 ${fontSize}px "Playfair Display", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // measureText for precise vertical centering
  const metrics = ctx.measureText(text);
  const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const y = size / 2 + (metrics.actualBoundingBoxAscent - textHeight / 2);

  ctx.fillText(text, size / 2, y);

  return canvas.toBuffer('image/png');
}

async function main() {
  // Try to register Playfair Display if available locally
  try {
    const fontPaths = [
      join(ROOT, 'public/fonts/PlayfairDisplay-Regular.ttf'),
      '/System/Library/Fonts/Supplemental/Palatino.ttc',
    ];
    for (const fp of fontPaths) {
      try {
        GlobalFonts.registerFromPath(fp, 'Playfair Display');
        console.log(`Font registered: ${fp}`);
        break;
      } catch { /* try next */ }
    }
  } catch { /* use system fallback */ }

  // icon-192.png
  const icon192 = drawIcon(192, 'MHJ', 60);
  writeFileSync(join(ROOT, 'public/icons/icon-192.png'), icon192);
  console.log('✓ icons/icon-192.png');

  // icon-512.png
  const icon512 = drawIcon(512, 'MHJ', 160);
  writeFileSync(join(ROOT, 'public/icons/icon-512.png'), icon512);
  console.log('✓ icons/icon-512.png');

  // apple-touch-icon.png (180x180)
  const apple = drawIcon(180, 'MHJ', 56);
  writeFileSync(join(ROOT, 'public/icons/apple-touch-icon.png'), apple);
  console.log('✓ icons/apple-touch-icon.png');

  // favicon.ico — 32x32 with just "M"
  const fav32 = drawIcon(32, 'M', 18);
  // Convert PNG to ICO format using sharp
  const faviconPng = await sharp(fav32)
    .resize(32, 32)
    .png()
    .toBuffer();
  writeFileSync(join(ROOT, 'public/favicon.ico'), faviconPng);
  console.log('✓ favicon.ico (32x32 PNG)');

  console.log('\nDone! All icons generated with brand brown #8A6B4F.');
}

main().catch(console.error);
