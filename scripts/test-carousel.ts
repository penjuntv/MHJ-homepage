/**
 * Carousel v3 visual QA — generates 7 PNG slides without server/auth.
 * Usage: npx tsx scripts/test-carousel.ts
 * Output: /tmp/carousel-test/slide-01-cover.png … slide-07-cta.png
 */

import React from 'react';
// Make React available globally for JSX components (tsx doesn't auto-inject it)
(globalThis as any).React = React;

import fs from 'fs';
import path from 'path';
import { ImageResponse } from 'next/og';

// — slide components (plain functions returning JSX) —
import { CoverSlide } from '../components/carousel/slides/CoverSlide';
import { ContentSlide } from '../components/carousel/slides/ContentSlide';
import { CtaSlide } from '../components/carousel/slides/CtaSlide';
import type { CarouselInput } from '../components/carousel/types';

// ──────── test data (v3 — 1 idea per slide) ────────
const testInput: CarouselInput = {
  category: 'NZ SCHOOL GUIDE',
  style: 'default',
  title: '5 things nobody tells you before NZ school',
  points: [
    {
      title: 'Your address decides your school',
      body: 'Check the school zone before signing a rental.',
    },
    {
      title: 'No hat, no play',
      body: 'Buy the hat first. Label it. Buy a spare.',
    },
    {
      title: 'There are NO cafeterias',
      body: 'Pack lunch every day. A thermos with warm rice is your best friend.',
    },
    {
      title: 'ESOL is free',
      body: 'Your child is assessed automatically. No forms, no cost.',
    },
    {
      title: 'Stationery is provided',
      body: 'The school supplies everything. Don\'t buy a pencil case.',
    },
  ],
  summaryPoints: [],
  ctaTitle: 'Save this for later ✓',
  ctaUrl: 'www.mhj.nz',
  instagramHandle: '@mhj_nz',
};

// ──────── font loading (filesystem, no HTTP) ────────
type FontDef = { name: string; data: ArrayBuffer; weight: 400 | 700 | 900; style: 'normal' | 'italic' };

function loadFonts(): FontDef[] {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');
  const load = (file: string): ArrayBuffer | null => {
    const fp = path.join(fontsDir, file);
    if (!fs.existsSync(fp)) return null;
    const buf = fs.readFileSync(fp);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  };

  const fonts: FontDef[] = [];
  const interReg = load('Inter-Regular.ttf');
  const interBold = load('Inter-Bold.ttf');
  const playfairBold = load('PlayfairDisplay-Bold.ttf');
  const playfairRegular = load('PlayfairDisplay-Regular.woff');
  const playfairBoldItalic = load('PlayfairDisplay-BoldItalic.woff');
  const notoKr = load('NotoSansKR-Bold.woff');

  if (interReg) fonts.push({ name: 'Inter', data: interReg, weight: 400, style: 'normal' });
  if (interBold) fonts.push({ name: 'Inter', data: interBold, weight: 700, style: 'normal' });
  if (playfairBold) fonts.push({ name: 'Playfair Display', data: playfairBold, weight: 700, style: 'normal' });
  if (playfairRegular) fonts.push({ name: 'Playfair Display', data: playfairRegular, weight: 400, style: 'normal' });
  if (playfairBoldItalic) fonts.push({ name: 'Playfair Display', data: playfairBoldItalic, weight: 700, style: 'italic' });
  if (notoKr) {
    fonts.push({ name: 'Noto Sans KR', data: notoKr, weight: 400, style: 'normal' });
    fonts.push({ name: 'Noto Sans KR', data: notoKr.slice(0), weight: 700, style: 'normal' });
  }
  return fonts;
}

// ──────── render ────────
async function renderSlide(jsx: React.ReactElement, fonts: FontDef[]): Promise<Buffer> {
  const response = new ImageResponse(jsx, {
    width: 1080,
    height: 1350,
    fonts: fonts as any,
  });
  const ab = await response.arrayBuffer();
  return Buffer.from(ab);
}

async function main() {
  const outDir = '/tmp/carousel-test';
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Loading fonts...');
  const fonts = loadFonts();
  console.log(`  ${fonts.length} fonts loaded`);

  const totalSlides = testInput.points.length + 2; // cover + contents + cta

  const slides: Array<{ name: string; jsx: React.ReactElement }> = [
    { name: 'slide-01-cover', jsx: CoverSlide(testInput) },
    ...testInput.points.map((_, i) => ({
      name: `slide-${String(i + 2).padStart(2, '0')}-content${i + 1}`,
      jsx: ContentSlide(testInput, i),
    })),
    { name: `slide-${String(totalSlides).padStart(2, '0')}-cta`, jsx: CtaSlide(testInput) },
  ];

  console.log(`Rendering ${slides.length} slides...`);
  for (const { name, jsx } of slides) {
    const buf = await renderSlide(jsx, fonts);
    const filePath = path.join(outDir, `${name}.png`);
    fs.writeFileSync(filePath, buf);
    console.log(`  ✓ ${filePath}  (${(buf.length / 1024).toFixed(0)} KB)`);
  }

  console.log(`\nDone! All ${slides.length} slides saved to /tmp/carousel-test/`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
