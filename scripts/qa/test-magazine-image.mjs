#!/usr/bin/env node
/**
 * lib/magazine-image.mjs 회귀 테스트 — 매거진 공개 화면 이미지 최적화 규칙.
 *   node scripts/qa/test-magazine-image.mjs
 */
import { readFileSync } from 'node:fs';
import {
  ALLOWED_WIDTHS, MAG_IMAGE_WIDTH, optimizeImageSrc, optimizeArticleImages, optimizePageImages, optimizeHtmlImages,
} from '../../lib/magazine-image.mjs';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  if (!ok) console.log(`✗ ${name}\n   got:  ${JSON.stringify(got)}\n   want: ${JSON.stringify(want)}`);
};
const throws = (name, fn) => { try { fn(); fail++; console.log(`✗ ${name} — 예외가 나야 한다`); } catch { pass++; } };

const SB = 'https://vpayqdatpqajsmalpfmq.supabase.co/storage/v1/object/public/images/articles/1784288620338_slot0.png';
const enc = (u, w, q = 75) => `/_next/image?url=${encodeURIComponent(u)}&w=${w}&q=${q}`;

// 1) 허용 폭이 next.config.mjs 와 같다 — 한쪽만 바꾸면 여기서 깨진다
const cfg = readFileSync(new URL('../../next.config.mjs', import.meta.url), 'utf8');
const nums = (key) => (cfg.match(new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`))?.[1] ?? '').split(',').map((s) => Number(s.trim())).filter(Boolean);
eq('허용 폭 = next.config imageSizes+deviceSizes', [...ALLOWED_WIDTHS].sort((a, b) => a - b), [...nums('imageSizes'), ...nums('deviceSizes')].sort((a, b) => a - b));
for (const [k, w] of Object.entries(MAG_IMAGE_WIDTH)) eq(`용도 폭 ${k}=${w} 는 허용 목록 안`, ALLOWED_WIDTHS.includes(w), true);

// 2) 변환 대상
eq('Supabase 공개 storage → 최적화', optimizeImageSrc(SB, 1080), enc(SB, 1080));
eq('품질 지정', optimizeImageSrc(SB, 640, 60), enc(SB, 640, 60));
eq('unsplash → 최적화', optimizeImageSrc('https://images.unsplash.com/photo-1?q=80&w=1000', 640), enc('https://images.unsplash.com/photo-1?q=80&w=1000', 640));
eq('picsum(폴백 데이터) → 최적화', optimizeImageSrc('https://picsum.photos/seed/mag1/800/1000', 640), enc('https://picsum.photos/seed/mag1/800/1000', 640));

// 3) 그대로 두는 것
eq('remotePatterns 밖 호스트는 그대로(최적화하면 400)', optimizeImageSrc('https://example.com/a.jpg', 640), 'https://example.com/a.jpg');
eq('Supabase 비공개 경로는 그대로', optimizeImageSrc('https://x.supabase.co/storage/v1/object/sign/a.png', 640), 'https://x.supabase.co/storage/v1/object/sign/a.png');
eq('http(비보안)는 그대로', optimizeImageSrc(SB.replace('https', 'http'), 640), SB.replace('https', 'http'));
eq('SVG 는 그대로', optimizeImageSrc(SB.replace('.png', '.svg'), 640), SB.replace('.png', '.svg'));
eq('GIF(대문자·쿼리) 는 그대로', optimizeImageSrc(SB.replace('.png', '.GIF') + '?v=1', 640), SB.replace('.png', '.GIF') + '?v=1');
eq('이미 최적화된 주소는 다시 감싸지 않음', optimizeImageSrc(enc(SB, 640), 1080), enc(SB, 640));
eq('상대 경로는 그대로', optimizeImageSrc('/placeholder.svg', 640), '/placeholder.svg');
eq('data URI 는 그대로', optimizeImageSrc('data:image/png;base64,AAA', 640), 'data:image/png;base64,AAA');
eq('빈 문자열', optimizeImageSrc('', 640), '');
eq('null', optimizeImageSrc(null, 640), null);
eq('undefined', optimizeImageSrc(undefined, 640), undefined);
throws('허용 밖 폭은 예외', () => optimizeImageSrc(SB, 1200));

// 4) 기사·쪽 단위
const art = { id: 1, image_url: SB, article_images: [SB, null, 'https://example.com/x.jpg'], png_url: SB, title: 't' };
const out = optimizeArticleImages(art, 1080);
eq('기사 image_url', out.image_url, enc(SB, 1080));
eq('기사 article_images(null·밖 호스트 보존)', out.article_images, [enc(SB, 1080), null, 'https://example.com/x.jpg']);
eq('png_url 은 원본 유지(OG·JSON-LD 용)', out.png_url, SB);
eq('다른 필드 유지', out.title, 't');
eq('원본 객체 불변', art.image_url, SB);
eq('article_images 없음 → 그대로', optimizeArticleImages({ id: 2, image_url: null }, 640), { id: 2, image_url: null, article_images: undefined });
eq('기사 null 통과', optimizeArticleImages(null, 640), null);
const pg = { id: 9, images: [SB, ''], captions: ['a'] };
eq('쪽 images', optimizePageImages(pg, 1080).images, [enc(SB, 1080), '']);
eq('쪽 다른 필드 유지', optimizePageImages(pg, 1080).captions, ['a']);
eq('쪽 원본 불변', pg.images[0], SB);
eq('쪽 images 없음', optimizePageImages({ id: 3 }, 640), { id: 3, images: undefined });

// 5) 본문 HTML 속 <img> (2026-09-19: 7월호 사이드바 본문에 원본 3장 6.7MB)
const amp = (u, w) => enc(u, w).replace(/&/g, '&amp;');
eq('HTML img src(큰따옴표)', optimizeHtmlImages(`<p>a</p><img class="x" src="${SB}" alt="b">`, 640), `<p>a</p><img class="x" src="${amp(SB, 640)}" alt="b">`);
eq("HTML img src(작은따옴표·대문자 태그)", optimizeHtmlImages(`<IMG src='${SB}'>`, 640), `<IMG src='${amp(SB, 640)}'>`);
eq('여러 장 모두', optimizeHtmlImages(`<img src="${SB}"><img src="${SB}">`, 1080), `<img src="${amp(SB, 1080)}"><img src="${amp(SB, 1080)}">`);
eq('밖 호스트 img 는 그대로', optimizeHtmlImages('<img src="https://example.com/a.jpg">', 640), '<img src="https://example.com/a.jpg">');
eq('img 가 아닌 태그의 src 는 그대로', optimizeHtmlImages(`<iframe src="${SB}"></iframe>`, 640), `<iframe src="${SB}"></iframe>`);
eq('data-src 는 그대로', optimizeHtmlImages(`<img data-src="${SB}">`, 640), `<img data-src="${SB}">`);
eq('img 없는 HTML 은 같은 문자열', optimizeHtmlImages('<p>hello</p>', 640), '<p>hello</p>');
eq('HTML null', optimizeHtmlImages(null, 640), null);
eq('이미 최적화된 HTML 은 그대로', optimizeHtmlImages(`<img src="${enc(SB, 640)}">`, 1080), `<img src="${enc(SB, 640)}">`);
const artH = optimizeArticleImages({ id: 61, content: `<img src="${SB}">`, sidebar_body: `<p>x</p><img src="${SB}">` }, 1080);
eq('기사 content HTML', artH.content, `<img src="${amp(SB, 1080)}">`);
eq('기사 sidebar_body HTML', artH.sidebar_body, `<p>x</p><img src="${amp(SB, 1080)}">`);
eq('쪽 content HTML', optimizePageImages({ images: [], content: `<img src="${SB}">` }, 640).content, `<img src="${amp(SB, 640)}">`);

console.log(`\ntest-magazine-image: ${pass} 통과 · ${fail} 실패`);
process.exit(fail ? 1 : 0);
