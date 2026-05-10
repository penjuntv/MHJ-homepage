/**
 * Satori font loader. Reads font binaries from public/fonts/ once,
 * caches at module scope so each request after warm-up is zero-cost.
 *
 * Korean glyphs come from Noto Sans KR (OTF). English from Inter (TTF).
 * Subset to 700/900 — Satori falls back to nearest weight when an exact
 * declared weight is missing (e.g. 800 → 700).
 */

import { promises as fs } from 'fs';
import path from 'path';

export type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700 | 900;
  style: 'normal' | 'italic';
};

let cache: SatoriFont[] | null = null;

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  // Buffer is a Uint8Array view; slice to ensure standalone ArrayBuffer copy
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

export async function loadCarouselFonts(): Promise<SatoriFont[]> {
  if (cache) return cache;
  const dir = path.join(process.cwd(), 'public', 'fonts');
  const [interReg, interBold, interBlack, notoBold, notoBlack,
         playfairBoldItalic, playfairBlackItalic, interBoldItalic] = await Promise.all([
    fs.readFile(path.join(dir, 'Inter-Regular.ttf')),
    fs.readFile(path.join(dir, 'Inter-Bold.ttf')),
    fs.readFile(path.join(dir, 'Inter-Black.ttf')),
    fs.readFile(path.join(dir, 'NotoSansKR-Bold.otf')),
    fs.readFile(path.join(dir, 'NotoSansKR-Black.otf')),
    fs.readFile(path.join(dir, 'PlayfairDisplay-BoldItalic.ttf')),
    fs.readFile(path.join(dir, 'PlayfairDisplay-BlackItalic.ttf')),
    fs.readFile(path.join(dir, 'Inter-BoldItalic.ttf')),
  ]);
  cache = [
    { name: 'Inter', data: toArrayBuffer(interReg), weight: 400, style: 'normal' },
    { name: 'Inter', data: toArrayBuffer(interBold), weight: 700, style: 'normal' },
    { name: 'Inter', data: toArrayBuffer(interBlack), weight: 900, style: 'normal' },
    { name: 'Noto Sans KR', data: toArrayBuffer(notoBold), weight: 700, style: 'normal' },
    { name: 'Noto Sans KR', data: toArrayBuffer(notoBlack), weight: 900, style: 'normal' },
    { name: 'Playfair Display', data: toArrayBuffer(playfairBoldItalic), weight: 700, style: 'italic' },
    { name: 'Playfair Display', data: toArrayBuffer(playfairBlackItalic), weight: 900, style: 'italic' },
    { name: 'Inter', data: toArrayBuffer(interBoldItalic), weight: 700, style: 'italic' },
    { name: 'Inter', data: toArrayBuffer(interBoldItalic), weight: 900, style: 'italic' },
  ];
  return cache;
}
