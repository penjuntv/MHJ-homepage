/**
 * MHJ Brand Kit — Print / Merchandise High-Res Assets
 * 300 DPI 기준, 의류·모자·굿즈 인쇄용 대형 파일
 *
 * 300 DPI 기준 크기:
 *   - 30cm (약 12인치) 인쇄 → 3600px
 *   - 20cm (약 8인치) 인쇄  → 2400px
 *   - 10cm (약 4인치) 인쇄  → 1200px
 */
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

GlobalFonts.register(
  fs.readFileSync('/tmp/fonts/PlayfairDisplay-Regular.ttf'),
  'Playfair Display'
);
GlobalFonts.register(
  fs.readFileSync('/tmp/fonts/Inter-Regular.ttf'),
  'Inter'
);

const C = {
  brown: '#8A6B4F',
  brownDark: '#C9A882',
  black: '#1E1E1E',
  green: '#3E5F4A',
  cream: '#FAF8F5',
  white: '#FFFFFF',
};

const OUT = path.join(__dirname, '..', 'mhj-brand-kit', 'png', 'print');

function saveCanvas(canvas, filename) {
  const fullPath = path.join(OUT, filename);
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(fullPath, buf);
  const kb = (buf.length / 1024).toFixed(1);
  const mb = (buf.length / 1024 / 1024).toFixed(2);
  console.log(`  ✓ ${filename.padEnd(50)} ${canvas.width}x${canvas.height}  ${buf.length > 1024*1024 ? mb+' MB' : kb+' KB'}`);
}

/** Draw MHJ wordmark centered at (cx, cy) */
function drawWordmark(ctx, cx, cy, scale, color) {
  const mhjSize = Math.round(42 * scale);
  ctx.font = `400 ${mhjSize}px "Playfair Display"`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const mhjMetrics = ctx.measureText('MHJ');
  const mhjAscent = mhjMetrics.actualBoundingBoxAscent;

  const lineGap = 11 * scale;
  const tagGap = 7 * scale;
  const tagSize = Math.round(10 * scale);

  ctx.font = `400 ${tagSize}px "Inter"`;
  const tagMetrics = ctx.measureText('my mairangi');
  const tagAscent = tagMetrics.actualBoundingBoxAscent;

  const totalHeight = mhjAscent + lineGap + 1 + tagGap + tagAscent;
  const topY = cy - totalHeight / 2;

  // MHJ
  ctx.font = `400 ${mhjSize}px "Playfair Display"`;
  ctx.fillStyle = color;
  const mhjY = topY + mhjAscent;
  ctx.fillText('MHJ', cx, mhjY);

  // Divider
  const mhjW = ctx.measureText('MHJ').width;
  const lineW = mhjW * 0.6;
  const lineY = mhjY + lineGap;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.beginPath();
  ctx.moveTo(cx - lineW / 2, lineY);
  ctx.lineTo(cx + lineW / 2, lineY);
  ctx.stroke();

  // Tagline
  ctx.font = `400 ${tagSize}px "Inter"`;
  ctx.fillStyle = color;
  ctx.letterSpacing = `${0.28 * tagSize}px`;
  const tagY = lineY + 1 * scale + tagGap + tagAscent;
  ctx.fillText('my mairangi', cx, tagY);
  ctx.letterSpacing = '0px';
}

/** Draw filled circle icon */
function drawIcon(ctx, cx, cy, radius, bgColor, textColor) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();

  const fontSize = Math.round(radius * 0.625);
  ctx.font = `400 ${fontSize}px "Playfair Display"`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const m = ctx.measureText('MHJ');
  ctx.fillText('MHJ', cx, cy + m.actualBoundingBoxAscent / 2);
}

// ══════════════════════════════════════════════════════════
// 1. 워드마크 — 대형 (가로 4000px, 투명 배경)
//    인쇄 시 약 34cm @ 300dpi
// ══════════════════════════════════════════════════════════
console.log('\n── Print Wordmarks (4000px wide) ──');

function printWordmark(filename, color) {
  const w = 4000, h = 2000;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  // transparent background
  drawWordmark(ctx, w / 2, h / 2, 12, color);
  saveCanvas(canvas, filename);
}

printWordmark('print-wordmark-brown-4000.png', C.brown);
printWordmark('print-wordmark-black-4000.png', C.black);
printWordmark('print-wordmark-white-4000.png', C.white);
printWordmark('print-wordmark-gold-4000.png', C.brownDark);

// ══════════════════════════════════════════════════════════
// 2. 워드마크 — 중형 (가로 2400px, 투명 배경)
//    인쇄 시 약 20cm @ 300dpi — 티셔츠 가슴 로고 적합
// ══════════════════════════════════════════════════════════
console.log('\n── Print Wordmarks (2400px wide) ──');

function printWordmarkMd(filename, color) {
  const w = 2400, h = 1200;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  drawWordmark(ctx, w / 2, h / 2, 7, color);
  saveCanvas(canvas, filename);
}

printWordmarkMd('print-wordmark-brown-2400.png', C.brown);
printWordmarkMd('print-wordmark-black-2400.png', C.black);
printWordmarkMd('print-wordmark-white-2400.png', C.white);

// ══════════════════════════════════════════════════════════
// 3. 원형 아이콘 — 대형 (3000x3000, 투명 배경)
//    모자, 자수, 원형 패치, 스티커 등
// ══════════════════════════════════════════════════════════
console.log('\n── Print Icons (3000x3000) ──');

function printIcon(filename, bgColor, textColor) {
  const size = 3000;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawIcon(ctx, size / 2, size / 2, size * 0.48, bgColor, textColor);
  saveCanvas(canvas, filename);
}

printIcon('print-icon-brown-3000.png', C.brown, C.white);
printIcon('print-icon-dark-3000.png', C.black, C.white);
printIcon('print-icon-green-3000.png', C.green, C.white);

// ══════════════════════════════════════════════════════════
// 4. 원형 아이콘 — 중형 (1500x1500)
//    모자 앞판, 작은 자수 등
// ══════════════════════════════════════════════════════════
console.log('\n── Print Icons (1500x1500) ──');

function printIconMd(filename, bgColor, textColor) {
  const size = 1500;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawIcon(ctx, size / 2, size / 2, size * 0.48, bgColor, textColor);
  saveCanvas(canvas, filename);
}

printIconMd('print-icon-brown-1500.png', C.brown, C.white);
printIconMd('print-icon-dark-1500.png', C.black, C.white);

// ══════════════════════════════════════════════════════════
// 5. MHJ 텍스트 전용 — 대형 (투명 배경, 텍스트만)
//    자수·각인·레이저 커팅 소스용
// ══════════════════════════════════════════════════════════
console.log('\n── Print Text Only (4000px wide) ──');

function printTextOnly(filename, color) {
  const w = 4000, h = 1200;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  const fontSize = 500;
  ctx.font = `400 ${fontSize}px "Playfair Display"`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const m = ctx.measureText('MHJ');
  ctx.fillText('MHJ', w / 2, h / 2 + m.actualBoundingBoxAscent / 2);

  saveCanvas(canvas, filename);
}

printTextOnly('print-text-brown-4000.png', C.brown);
printTextOnly('print-text-black-4000.png', C.black);
printTextOnly('print-text-white-4000.png', C.white);

// ══════════════════════════════════════════════════════════
// 6. 풀 로고 크림 배경판 — 대형 (4000px)
//    인쇄소에 바로 넘길 수 있는 배경 포함 버전
// ══════════════════════════════════════════════════════════
console.log('\n── Print Full Logo with Background (4000px) ──');

{
  const w = 4000, h = 2000;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, w, h);
  drawWordmark(ctx, w / 2, h / 2, 12, C.brown);
  saveCanvas(canvas, 'print-wordmark-cream-bg-4000.png');
}

{
  const size = 3000;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, size, size);
  drawIcon(ctx, size / 2, size / 2, size * 0.42, C.brown, C.white);
  saveCanvas(canvas, 'print-icon-cream-bg-3000.png');
}

console.log('\n✅ All print-ready assets generated!');
