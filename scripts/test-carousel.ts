/**
 * Carousel v2 visual QA — generates 10 PNG slides without server/auth.
 * Usage: npx tsx scripts/test-carousel.ts
 * Output: /tmp/carousel-test/slide-01.png … slide-10.png
 */

import React from 'react';
// Make React available globally for JSX components (tsx doesn't auto-inject it)
(globalThis as any).React = React;

import fs from 'fs';
import path from 'path';
import { ImageResponse } from 'next/og';

// — slide components (plain functions returning JSX) —
import { CoverSlide } from '../components/carousel/slides/CoverSlide';
import { ContextSlide } from '../components/carousel/slides/ContextSlide';
import { ContentSlide } from '../components/carousel/slides/ContentSlide';
import { SummarySlide } from '../components/carousel/slides/SummarySlide';
import { YussiTakeSlide } from '../components/carousel/slides/YussiTakeSlide';
import { VisualBreakSlide } from '../components/carousel/slides/VisualBreakSlide';
import { CtaSlide } from '../components/carousel/slides/CtaSlide';
import type { CarouselInput } from '../components/carousel/types';

// ──────── test data ────────
const testInput: CarouselInput = {
  category: 'NZ SCHOOL GUIDE',
  style: 'default',
  title: '5 things nobody tells you before NZ school',
  subtitle: "A real parent's checklist from Mairangi Bay",
  titleKr: 'NZ 학교 입학 전 아무도 안 알려주는 5가지',
  points: [
    {
      title: 'Your address decides your school',
      body: 'Every school has a zone. Inside = guaranteed. Outside = ballot. Check before you sign a rental agreement.',
      highlight: 'Check the school zone BEFORE signing a rental',
      highlightKr: '임대 계약 전에 학군부터 확인하세요',
    },
    {
      title: 'No hat, no play — seriously',
      body: 'In Terms 1 and 4, if your child has no school hat, they sit in the shade. No playground. No field. Buy the hat first.',
      highlight: 'Buy the hat first. Label it. Buy a spare.',
      highlightKr: '모자를 가장 먼저 사세요. 여분도 하나 더.',
    },
    {
      title: 'There are NO cafeterias',
      body: 'Pack lunch every day. No microwaves. 10 min eating time then outside to play. A thermos with warm rice is fine in winter.',
      highlight: 'Thermos with warm rice or noodles = winter hero',
      highlightKr: '겨울에는 보온통에 따뜻한 밥이나 국수',
    },
    {
      title: 'ESOL is free — you don\'t even apply',
      body: 'Government-funded English support. Your child is assessed automatically in weeks 1-2. No forms, no cost.',
      highlight: 'Ask: How many ESOL hours will my child get?',
      highlightKr: '입학 미팅에서 ESOL 시간을 물어보세요',
    },
  ],
  summaryPoints: [
    '✓ Check school zone before signing rental',
    '✓ Hat is the #1 priority item',
    '✓ Pack lunch every day — no microwaves',
    '✓ ESOL happens automatically — just ask about hours',
  ],
  summaryKr: [
    '✓ 임대 계약 전 학군 확인',
    '✓ 모자가 최우선 준비물',
    '✓ 매일 도시락 — 전자레인지 없음',
    '✓ ESOL 자동 배정 — 시간만 확인',
  ],
  pullQuote: 'The things you stress about most aren\'t the real challenges.',
  yussiTake:
    "Starting 3 kids in NZ schools taught me that the things you stress about most aren't the real challenges. The real ones are the ones nobody mentions — like the hat rule, or packing lunch when you don't even know what Kiwi kids eat.",
  yussiTakeKr:
    '세 아이를 NZ 학교에 보내면서 배운 건, 가장 걱정했던 것들이 진짜 문제가 아니라는 거예요. 진짜 문제는 아무도 안 알려주는 것들이에요.',
  ctaTitle: 'Read the full guide',
  ctaUrl: 'www.mhj.nz',
  instagramHandle: '@mhj_nz',
};

// ──────── font loading (filesystem, no HTTP) ────────
type FontDef = { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' | 'italic' };

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

  const slides: Array<{ name: string; jsx: React.ReactElement }> = [
    { name: 'slide-01-cover',   jsx: CoverSlide(testInput) },
    { name: 'slide-02-context', jsx: ContextSlide(testInput) },
    { name: 'slide-03-content1', jsx: ContentSlide(testInput, 0) },
    { name: 'slide-04-content2', jsx: ContentSlide(testInput, 1) },
    { name: 'slide-05-content3', jsx: ContentSlide(testInput, 2) },
    { name: 'slide-06-content4', jsx: ContentSlide(testInput, 3) },
    { name: 'slide-07-summary', jsx: SummarySlide(testInput) },
    { name: 'slide-08-yussi',   jsx: YussiTakeSlide(testInput) },
    { name: 'slide-09-quote',   jsx: VisualBreakSlide(testInput) },
    { name: 'slide-10-cta',     jsx: CtaSlide(testInput) },
  ];

  console.log('Rendering 10 slides...');
  for (const { name, jsx } of slides) {
    const buf = await renderSlide(jsx, fonts);
    const filePath = path.join(outDir, `${name}.png`);
    fs.writeFileSync(filePath, buf);
    console.log(`  ✓ ${filePath}  (${(buf.length / 1024).toFixed(0)} KB)`);
  }

  console.log('\nDone! All 10 slides saved to /tmp/carousel-test/');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
