/**
 * MHJ Brand Kit — PNG Generator
 * Uses @napi-rs/canvas to render all PNG assets
 */
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

// ── Register fonts ──
GlobalFonts.register(
  fs.readFileSync('/tmp/fonts/PlayfairDisplay-Regular.ttf'),
  'Playfair Display'
);
GlobalFonts.register(
  fs.readFileSync('/tmp/fonts/Inter-Regular.ttf'),
  'Inter'
);

// ── Brand constants ──
const C = {
  brown: '#8A6B4F',
  brownDark: '#C9A882',
  black: '#1E1E1E',
  green: '#3E5F4A',
  cream: '#FAF8F5',
  white: '#FFFFFF',
};

const OUT = path.join(__dirname, '..', 'mhj-brand-kit', 'png');

// ── Helpers ──
function saveCanvas(canvas, relPath) {
  const fullPath = path.join(OUT, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(fullPath, buf);
  const kb = (buf.length / 1024).toFixed(1);
  console.log(`  ✓ ${relPath} (${kb} KB)`);
}

function fillBg(ctx, w, h, color) {
  if (color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
  }
}

/** Draw MHJ wordmark centered at (cx, cy) with given scale and color */
function drawWordmark(ctx, cx, cy, scale, color) {
  // MHJ text
  const mhjSize = Math.round(42 * scale);
  ctx.font = `400 ${mhjSize}px "Playfair Display"`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const mhjMetrics = ctx.measureText('MHJ');
  const mhjAscent = mhjMetrics.actualBoundingBoxAscent;

  // Position MHJ so the whole wordmark group is visually centered
  // Group: MHJ text + 11px gap + line + 7px gap + tagline
  const lineGap = 11 * scale;
  const tagGap = 7 * scale;
  const tagSize = Math.round(10 * scale);

  ctx.font = `400 ${tagSize}px "Inter"`;
  const tagMetrics = ctx.measureText('my mairangi');
  const tagAscent = tagMetrics.actualBoundingBoxAscent;

  const totalHeight = mhjAscent + lineGap + 1 + tagGap + tagAscent;
  const topY = cy - totalHeight / 2;

  // Draw MHJ
  ctx.font = `400 ${mhjSize}px "Playfair Display"`;
  ctx.fillStyle = color;
  const mhjY = topY + mhjAscent;
  ctx.fillText('MHJ', cx, mhjY);

  // Draw divider line (60% of MHJ text width)
  const mhjW = ctx.measureText('MHJ').width;
  const lineW = mhjW * 0.6;
  const lineY = mhjY + lineGap;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(cx - lineW / 2, lineY);
  ctx.lineTo(cx + lineW / 2, lineY);
  ctx.stroke();

  // Draw tagline
  ctx.font = `400 ${tagSize}px "Inter"`;
  ctx.fillStyle = color;
  ctx.letterSpacing = `${0.28 * tagSize}px`;
  const tagY = lineY + 1 * scale + tagGap + tagAscent;
  ctx.fillText('my mairangi', cx, tagY);
  ctx.letterSpacing = '0px';
}

/** Draw filled circle icon with MHJ at center */
function drawIcon(ctx, cx, cy, radius, bgColor, textColor) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();

  const fontSize = Math.round(radius * 0.625); // 20/32 ratio from original icon
  ctx.font = `400 ${fontSize}px "Playfair Display"`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const m = ctx.measureText('MHJ');
  const textY = cy + m.actualBoundingBoxAscent / 2;
  ctx.fillText('MHJ', cx, textY);
}

/** Draw small wordmark for templates */
function drawSmallWordmark(ctx, x, y, height, color) {
  const scale = height / 60; // 60 = original wordmark height
  // MHJ text
  const mhjSize = Math.round(42 * scale);
  ctx.font = `400 ${mhjSize}px "Playfair Display"`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const mhjMetrics = ctx.measureText('MHJ');
  ctx.fillText('MHJ', x, y + mhjMetrics.actualBoundingBoxAscent);

  // Divider
  const mhjW = mhjMetrics.width;
  const lineY = y + mhjMetrics.actualBoundingBoxAscent + 6 * scale;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.5, 1 * scale);
  ctx.beginPath();
  ctx.moveTo(x, lineY);
  ctx.lineTo(x + mhjW * 0.6, lineY);
  ctx.stroke();

  // Tagline
  const tagSize = Math.max(6, Math.round(10 * scale));
  ctx.font = `400 ${tagSize}px "Inter"`;
  ctx.fillStyle = color;
  ctx.letterSpacing = `${0.28 * tagSize}px`;
  const tagY = lineY + 5 * scale + tagSize;
  ctx.fillText('my mairangi', x, tagY);
  ctx.letterSpacing = '0px';
}

// ══════════════════════════════════════════
// 1. PROFILE IMAGES
// ══════════════════════════════════════════
console.log('\n── Profile Images ──');

function generateProfile(size, filename, transparent) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  if (!transparent) {
    fillBg(ctx, size, size, C.cream);
  }

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35; // 70% diameter → 35% radius

  drawIcon(ctx, cx, cy, radius, C.brown, C.white);
  saveCanvas(canvas, `profile/${filename}`);
}

generateProfile(1080, 'profile-instagram-1080.png', false);
generateProfile(800, 'profile-facebook-800.png', false);
generateProfile(800, 'profile-youtube-800.png', false);
generateProfile(500, 'profile-general-500.png', false);
generateProfile(1080, 'profile-transparent-1080.png', true);

// ══════════════════════════════════════════
// 2. COVER / BANNER IMAGES
// ══════════════════════════════════════════
console.log('\n── Cover Images ──');

// Facebook cover 851×315
{
  const w = 851, h = 315;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  fillBg(ctx, w, h, C.cream);
  // Logo center-right to avoid profile photo overlap at bottom-left
  drawWordmark(ctx, w * 0.55, h * 0.45, 1.8, C.brown);
  // Subtitle
  ctx.font = '400 11px "Inter"';
  ctx.fillStyle = C.brown;
  ctx.textAlign = 'center';
  ctx.letterSpacing = `${0.2 * 11}px`;
  ctx.fillText('A family archive from Mairangi Bay, Auckland.', w * 0.55, h * 0.82);
  ctx.letterSpacing = '0px';
  saveCanvas(canvas, 'cover/cover-facebook.png');
}

// YouTube banner 2560×1440, safe area 1546×423
{
  const w = 2560, h = 1440;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  fillBg(ctx, w, h, C.cream);
  // Centered in safe area (center of canvas)
  drawWordmark(ctx, w / 2, h / 2, 3.5, C.brown);
  ctx.font = '400 16px "Inter"';
  ctx.fillStyle = C.brown;
  ctx.textAlign = 'center';
  ctx.letterSpacing = `${0.2 * 16}px`;
  ctx.fillText('A family archive from Mairangi Bay, Auckland.', w / 2, h / 2 + 140);
  ctx.letterSpacing = '0px';
  saveCanvas(canvas, 'cover/cover-youtube.png');
}

// Instagram story highlight cover 1080×1920
{
  const w = 1080, h = 1920;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  fillBg(ctx, w, h, C.cream);
  drawIcon(ctx, w / 2, h / 2, 180, C.brown, C.white);
  saveCanvas(canvas, 'cover/cover-instagram-story.png');
}

// LinkedIn banner 1584×396
{
  const w = 1584, h = 396;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  fillBg(ctx, w, h, C.cream);
  // Left-aligned wordmark
  drawWordmark(ctx, w * 0.2, h / 2, 2.2, C.brown);
  ctx.font = '400 12px "Inter"';
  ctx.fillStyle = C.brown;
  ctx.textAlign = 'left';
  ctx.letterSpacing = `${0.2 * 12}px`;
  ctx.fillText('A family archive from Mairangi Bay, Auckland.', w * 0.12, h * 0.78);
  ctx.letterSpacing = '0px';
  saveCanvas(canvas, 'cover/cover-linkedin.png');
}

// ══════════════════════════════════════════
// 3. CONTENT TEMPLATES
// ══════════════════════════════════════════
console.log('\n── Template Images ──');

// Instagram square post 1080×1080
{
  const w = 1080, h = 1080;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  fillBg(ctx, w, h, C.cream);
  drawSmallWordmark(ctx, 60, 50, 60, C.brown);
  saveCanvas(canvas, 'template/template-post-square.png');
}

// Instagram portrait post 1080×1350
{
  const w = 1080, h = 1350;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  fillBg(ctx, w, h, C.cream);
  // Top center wordmark
  const mhjSize = 28;
  ctx.font = `400 ${mhjSize}px "Playfair Display"`;
  ctx.fillStyle = C.brown;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('MHJ', w / 2, 70);
  const mhjW = ctx.measureText('MHJ').width;
  ctx.strokeStyle = C.brown;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(w / 2 - mhjW * 0.3, 78);
  ctx.lineTo(w / 2 + mhjW * 0.3, 78);
  ctx.stroke();
  ctx.font = '400 8px "Inter"';
  ctx.letterSpacing = `${0.28 * 8}px`;
  ctx.fillText('my mairangi', w / 2, 92);
  ctx.letterSpacing = '0px';
  saveCanvas(canvas, 'template/template-post-portrait.png');
}

// Story template 1080×1920
{
  const w = 1080, h = 1920;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  fillBg(ctx, w, h, C.cream);
  // Bottom wordmark (above safe zone: bottom 20% = 384px, so place at ~75%)
  drawSmallWordmark(ctx, w / 2 - 50, h * 0.75, 50, C.brown);
  saveCanvas(canvas, 'template/template-story.png');
}

// Quote square template 1080×1080
{
  const w = 1080, h = 1080;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  fillBg(ctx, w, h, C.cream);

  // Large opening quote mark
  ctx.font = '400 200px "Playfair Display"';
  ctx.fillStyle = C.brown;
  ctx.globalAlpha = 0.12;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('\u201C', w / 2, 380);
  ctx.globalAlpha = 1.0;

  // Bottom center MHJ
  const mhjSize = 24;
  ctx.font = `400 ${mhjSize}px "Playfair Display"`;
  ctx.fillStyle = C.brown;
  ctx.textAlign = 'center';
  ctx.fillText('MHJ', w / 2, h - 80);
  const mhjW = ctx.measureText('MHJ').width;
  ctx.strokeStyle = C.brown;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(w / 2 - mhjW * 0.3, h - 72);
  ctx.lineTo(w / 2 + mhjW * 0.3, h - 72);
  ctx.stroke();
  ctx.font = '400 7px "Inter"';
  ctx.letterSpacing = `${0.28 * 7}px`;
  ctx.fillText('my mairangi', w / 2, h - 58);
  ctx.letterSpacing = '0px';
  saveCanvas(canvas, 'template/template-quote-square.png');
}

// ══════════════════════════════════════════
// 4. WATERMARKS
// ══════════════════════════════════════════
console.log('\n── Watermarks ──');

function generateWatermark(filename, color) {
  const w = 600, h = 200;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  // transparent background

  ctx.globalAlpha = 0.5;
  ctx.font = '400 72px "Playfair Display"';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const m = ctx.measureText('MHJ');
  const y = h / 2 + m.actualBoundingBoxAscent / 2;
  ctx.fillText('MHJ', w / 2, y);

  // Divider
  const lineW = m.width * 0.6;
  const lineY = y + 14;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2 - lineW / 2, lineY);
  ctx.lineTo(w / 2 + lineW / 2, lineY);
  ctx.stroke();

  // Tagline
  ctx.font = '400 14px "Inter"';
  ctx.letterSpacing = `${0.28 * 14}px`;
  ctx.fillText('my mairangi', w / 2, lineY + 22);
  ctx.letterSpacing = '0px';
  ctx.globalAlpha = 1.0;

  saveCanvas(canvas, `watermark/${filename}`);
}

generateWatermark('watermark-brown.png', C.brown);
generateWatermark('watermark-white.png', C.white);

// ══════════════════════════════════════════
// 5. OG IMAGE
// ══════════════════════════════════════════
console.log('\n── OG Image ──');
{
  const w = 1200, h = 630;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  fillBg(ctx, w, h, C.cream);
  drawWordmark(ctx, w / 2, h * 0.42, 2.5, C.brown);

  ctx.font = '400 14px "Inter"';
  ctx.fillStyle = C.brown;
  ctx.textAlign = 'center';
  ctx.letterSpacing = `${0.2 * 14}px`;
  ctx.fillText('A family archive from Mairangi Bay, Auckland.', w / 2, h * 0.72);
  ctx.letterSpacing = '0px';

  saveCanvas(canvas, 'og/og-default.png');
}

// ══════════════════════════════════════════
// 6. EMAIL LOGOS
// ══════════════════════════════════════════
console.log('\n── Email Logos ──');

// Email logo — white background, brown wordmark, 300×100 (@2x)
{
  const w = 300, h = 100;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  fillBg(ctx, w, h, C.white);
  drawWordmark(ctx, w / 2, h / 2, 0.9, C.brown);
  saveCanvas(canvas, 'email/email-logo.png');
}

// Email logo dark — transparent, gold wordmark
{
  const w = 300, h = 100;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  drawWordmark(ctx, w / 2, h / 2, 0.9, C.brownDark);
  saveCanvas(canvas, 'email/email-logo-dark.png');
}

console.log('\n✅ All PNG files generated!');
