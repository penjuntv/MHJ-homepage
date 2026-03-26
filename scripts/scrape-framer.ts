/**
 * scripts/scrape-framer.ts
 * Framer 사이트(mhjnz.framer.website)에서 블로그 글을 스크래핑합니다.
 *
 * 실행: npx ts-node scripts/scrape-framer.ts
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// ──────────────────────────────────────────────────────────
// 상수
// ──────────────────────────────────────────────────────────

const BASE_URL = 'https://mhjnz.framer.website';
const BLOG_LIST_URL = `${BASE_URL}/blog`;
const OUTPUT_DIR = path.join(process.cwd(), 'scripts', 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'framer-blogs.json');
const DELAY_MS = 1000; // 요청 간 딜레이 (ms)
const AUTHOR = 'Yussi';

// 카테고리 매핑 (slug 접두사 기준)
const CATEGORY_MAP: Record<string, string> = {
  'education': 'Education',
  'settlement': 'Settlement',
  'girls': 'Girls',
  'locals': 'Locals',
};

// ──────────────────────────────────────────────────────────
// 유틸리티
// ──────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
    });
    if (!res.ok) {
      console.warn(`  ⚠ HTTP ${res.status} — ${url}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`  ⚠ fetch 실패: ${url}`, err);
    return null;
  }
}

/** URL 마지막 path segment를 slug로 추출 */
function slugFromUrl(url: string): string {
  const u = new URL(url, BASE_URL);
  const parts = u.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

/** slug 접두사로 카테고리 판별 */
function categoryFromSlug(slug: string): string {
  const prefix = slug.split('-')[0].toLowerCase();
  return CATEGORY_MAP[prefix] ?? 'Life';
}

/** 날짜 문자열을 "2026.01.15" 형식으로 정규화 */
function normalizeDate(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.trim();

  // 이미 "2026.01.15" 형태
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(cleaned)) return cleaned;

  // "January 15, 2026" 또는 "Jan 15, 2026"
  const months: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04',
    may: '05', june: '06', july: '07', august: '08',
    september: '09', october: '10', november: '11', december: '12',
    jan: '01', feb: '02', mar: '03', apr: '04',
    jun: '06', jul: '07', aug: '08',
    sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const m1 = cleaned.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/i);
  if (m1) {
    const mon = months[m1[1].toLowerCase()];
    if (mon) return `${m1[3]}.${mon}.${m1[2].padStart(2, '0')}`;
  }

  // "2026-01-15" 또는 "2026/01/15"
  const m2 = cleaned.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (m2) return `${m2[1]}.${m2[2]}.${m2[3]}`;

  return cleaned; // 파싱 불가시 원문 반환
}

/** framerusercontent.com 이미지 URL 추출 (쿼리스트링 제거) */
function cleanFramerImageUrl(src: string): string {
  try {
    const u = new URL(src);
    // framerusercontent.com 이미지만 보존
    if (u.hostname.includes('framerusercontent.com')) {
      // scale= 등 불필요한 파라미터 제거, 원본 유지
      return src;
    }
    return src;
  } catch {
    return src;
  }
}

// ──────────────────────────────────────────────────────────
// 1단계: 블로그 목록 페이지에서 모든 글 URL 수집
// ──────────────────────────────────────────────────────────

async function collectBlogUrls(): Promise<string[]> {
  console.log(`\n📋 블로그 목록 페이지 수집 중: ${BLOG_LIST_URL}`);
  const html = await fetchHtml(BLOG_LIST_URL);
  if (!html) {
    console.error('블로그 목록 페이지 로드 실패');
    return [];
  }

  const $ = cheerio.load(html);
  const urls = new Set<string>();

  // /blog/ 경로를 포함하는 모든 링크 수집
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (href.includes('/blog/') && !href.endsWith('/blog/')) {
      try {
        const full = new URL(href, BASE_URL).toString();
        // 같은 도메인만
        if (full.startsWith(BASE_URL)) urls.add(full);
      } catch {
        // 상대경로 처리
        if (href.startsWith('/blog/')) {
          urls.add(`${BASE_URL}${href}`);
        }
      }
    }
  });

  const list = Array.from(urls);
  console.log(`  → ${list.length}개 URL 발견`);
  return list;
}

// ──────────────────────────────────────────────────────────
// 2단계: 개별 글 페이지 파싱
// ──────────────────────────────────────────────────────────

interface BlogPost {
  title: string;
  slug: string;
  category: string;
  date: string;
  author: string;
  content: string;
  image_url: string;
  meta_description: string;
}

async function parseBlogPost(url: string): Promise<BlogPost | null> {
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const framerSlug = slugFromUrl(url);

  try {
    // ── 제목 ──────────────────────────────────────────────
    let title = '';
    // 우선순위: og:title → h1 → title 태그
    title = $('meta[property="og:title"]').attr('content') ?? '';
    if (!title) title = $('h1').first().text().trim();
    if (!title) title = $('title').text().replace(/\s*[-|].*$/, '').trim();
    if (!title) title = framerSlug.replace(/-/g, ' ');

    // ── 날짜 ──────────────────────────────────────────────
    let rawDate = '';
    // time 태그, datetime 속성
    rawDate = $('time').first().attr('datetime') ?? $('time').first().text().trim();
    // 날짜처럼 생긴 텍스트 탐색 (YYYY, Month 패턴)
    if (!rawDate) {
      $('*').each((_, el) => {
        const text = $(el).clone().children().remove().end().text().trim();
        if (/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(text) && /\d{4}/.test(text)) {
          rawDate = text;
          return false; // break
        }
        if (/^\d{4}\.\d{2}\.\d{2}$/.test(text)) {
          rawDate = text;
          return false;
        }
      });
    }
    const date = normalizeDate(rawDate) || '2026.01.01';

    // ── 대표 이미지 ────────────────────────────────────────
    let image_url = '';
    // og:image 우선
    image_url = $('meta[property="og:image"]').attr('content') ?? '';
    // framerusercontent.com 이미지 탐색
    if (!image_url || !image_url.includes('framerusercontent.com')) {
      $('img').each((_, el) => {
        const src = $(el).attr('src') ?? $(el).attr('data-src') ?? '';
        if (src.includes('framerusercontent.com')) {
          image_url = cleanFramerImageUrl(src);
          return false; // 첫 번째 이미지 사용
        }
      });
    }
    if (image_url) image_url = cleanFramerImageUrl(image_url);

    // ── 본문 콘텐츠 ────────────────────────────────────────
    // Framer는 article, main, 또는 특정 div 내에 본문을 담음
    let $content = $('article').first();
    if (!$content.length) $content = $('main').first();
    if (!$content.length) $content = $('[class*="content"]').first();
    if (!$content.length) $content = $('body');

    // 네비게이션, 헤더, 푸터 등 제거
    $content.find('nav, header, footer, script, style, noscript, [class*="nav"], [class*="header"], [class*="footer"]').remove();

    // 본문 이미지 URL 정리 (framerusercontent.com 보존)
    $content.find('img').each((_, el) => {
      const src = $(el).attr('src') ?? '';
      const dataSrc = $(el).attr('data-src') ?? '';
      const finalSrc = dataSrc || src;
      if (finalSrc) $(el).attr('src', cleanFramerImageUrl(finalSrc));
      $(el).removeAttr('data-src').removeAttr('srcset').removeAttr('data-srcset');
    });

    // 불필요한 속성 제거 (class, style 등은 유지해도 무방하나 정리)
    $content.find('*').each((_, el) => {
      $(el).removeAttr('data-framer-component-type')
           .removeAttr('data-framer-name')
           .removeAttr('data-framer-appear-id');
    });

    const content = $content.html()?.trim() ?? '';

    // ── meta_description ──────────────────────────────────
    let meta_description = '';
    meta_description = $('meta[name="description"]').attr('content') ??
                       $('meta[property="og:description"]').attr('content') ?? '';
    if (!meta_description) {
      // 본문 첫 200자 텍스트
      const plainText = $content.text().replace(/\s+/g, ' ').trim();
      meta_description = plainText.slice(0, 200);
    }

    const category = categoryFromSlug(framerSlug);

    return {
      title,
      slug: framerSlug,
      category,
      date,
      author: AUTHOR,
      content,
      image_url,
      meta_description,
    };
  } catch (err) {
    console.warn(`  ✗ 파싱 실패: ${url}`, err);
    return null;
  }
}

// ──────────────────────────────────────────────────────────
// 메인 실행
// ──────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Framer 블로그 스크래핑 시작\n');

  // output 디렉토리 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1단계: URL 수집
  let urls = await collectBlogUrls();

  // URL이 없거나 부족하면 알려진 슬러그 목록으로 보완
  const knownSlugs = [
    'education-001', 'education-002', 'education-003', 'education-004',
    'education-005', 'education-006', 'education-007',
    'settlement-001', 'settlement-002', 'settlement-003', 'settlement-004',
    'settlement-005', 'settlement-006', 'settlement-007', 'settlement-008',
    'girls-001', 'girls-002', 'girls-003', 'girls-004',
    'locals-001', 'locals-002',
  ];
  const knownUrls = knownSlugs.map(s => `${BASE_URL}/blog/${s}`);
  const allUrls = Array.from(new Set([...urls, ...knownUrls]));
  console.log(`\n📌 수집 + 알려진 URL 합산: 총 ${allUrls.length}개\n`);

  // 2단계: 각 글 파싱
  const results: BlogPost[] = [];
  const failed: string[] = [];

  for (let i = 0; i < allUrls.length; i++) {
    const url = allUrls[i];
    const slug = slugFromUrl(url);
    process.stdout.write(`[${String(i + 1).padStart(2, '0')}/${allUrls.length}] ${slug} ... `);

    const post = await parseBlogPost(url);
    if (post) {
      results.push(post);
      console.log(`✓  "${post.title.slice(0, 40)}"`);
    } else {
      failed.push(url);
      console.log('✗  스킵');
    }

    if (i < allUrls.length - 1) await sleep(DELAY_MS);
  }

  // 3단계: JSON 저장
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');

  // 결과 요약
  console.log('\n' + '─'.repeat(50));
  console.log(`✅ 총 ${results.length}개 글 추출 완료`);
  console.log(`📁 저장 위치: ${OUTPUT_FILE}`);
  if (failed.length > 0) {
    console.log(`⚠  실패/스킵: ${failed.length}개`);
    failed.forEach(u => console.log(`   - ${u}`));
  }
  console.log('─'.repeat(50) + '\n');

  // 카테고리별 통계
  const stats: Record<string, number> = {};
  results.forEach(p => { stats[p.category] = (stats[p.category] ?? 0) + 1; });
  console.log('카테고리별 수집 결과:');
  Object.entries(stats).forEach(([cat, count]) => {
    console.log(`  ${cat.padEnd(12)}: ${count}개`);
  });
  console.log('');
}

main().catch(console.error);
