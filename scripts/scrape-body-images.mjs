/**
 * scrape-body-images.mjs
 * Framer 블로그 본문 이미지 수집 → Supabase Storage 업로드 → DB blockquote→figure 교체
 *
 * 실행: node scripts/scrape-body-images.mjs
 * 선택: node scripts/scrape-body-images.mjs --slug education-001
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── 환경변수 로드 ─────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local');
const envRaw = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ SUPABASE_URL 또는 ANON_KEY 누락');
  process.exit(1);
}

// SERVICE_KEY는 유효한 JWT(>200자)여야 함 — 짧으면 ANON_KEY 사용
const AUTH_KEY = (SERVICE_KEY && SERVICE_KEY.length > 100) ? SERVICE_KEY : ANON_KEY;
const BASE_HEADERS = {
  'apikey': AUTH_KEY,
  'Authorization': `Bearer ${AUTH_KEY}`,
  'Accept': 'application/json',
};

// ─── 대상 블로그 목록 ────────────────────────────────────────────────────────
const BLOGS = [
  { id: 13, slug: 'education-001', title: 'Back-to-School Shopping' },
  { id: 14, slug: 'education-002', title: 'Understanding Year 7' },
  { id: 15, slug: 'education-003', title: 'Y7 Part 1: English & Mathematics' },
  { id: 16, slug: 'education-004', title: 'Y7 Part 2: Science & Social Science' },
  { id: 17, slug: 'education-005', title: 'HL #0 Why Home-Learning?' },
  { id: 18, slug: 'education-006', title: 'HL #1 Setting Personal Routines' },
  { id: 19, slug: 'education-007', title: 'HL #2 (추가 확인)' },
  { id: 20, slug: 'settlement-001', title: 'Back to School (What?!)' },
  { id: 21, slug: 'settlement-002', title: 'Life Came Without a Manual' },
  { id: 22, slug: 'settlement-003', title: 'Night Above the Clouds' },
  { id: 23, slug: 'settlement-004', title: 'Kia Ora, Aotearoa' },
  { id: 24, slug: 'settlement-005', title: 'How We Met Our Home' },
  { id: 25, slug: 'settlement-006', title: 'School Days Begin' },
  { id: 26, slug: 'settlement-007', title: 'Landing Home' },
  { id: 27, slug: 'settlement-008', title: 'Byebye Mommy' },
  { id: 28, slug: 'girls-001', title: 'Playground Wonderland' },
  { id: 29, slug: 'girls-002', title: 'School Festival' },
  { id: 30, slug: 'girls-003', title: 'Basketball Tuesdays' },
  { id: 31, slug: 'girls-004', title: 'Year 6 Graduation' },
  { id: 32, slug: 'locals-001', title: 'In a Mingling World' },
  { id: 33, slug: 'locals-002', title: 'A Day at Ruakākā Beach' },
];

const FRAMER_BASE = 'https://mhjnz.framer.website/blog';
const OUTPUT_DIR = path.join(__dirname, 'output', 'body-images');

// ─── CLI 인자 처리 ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const slugFilter = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
const dryRun = args.includes('--dry-run');

const targetBlogs = slugFilter
  ? BLOGS.filter(b => b.slug === slugFilter)
  : BLOGS;

// ─── Supabase REST 헬퍼 ──────────────────────────────────────────────────────
async function dbGetBlog(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/blogs?id=eq.${id}&select=id,title,slug,content,content_backup`, {
    headers: BASE_HEADERS,
  });
  if (!res.ok) throw new Error(`dbGetBlog ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  return rows[0] || null;
}

async function dbUpdate(id, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/blogs?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      ...BASE_HEADERS,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`dbUpdate ${res.status}: ${text}`);
  }
}

async function storageUpload(storagePath, buffer, contentType = 'image/webp') {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/images/${storagePath}`, {
    method: 'POST',
    headers: {
      'apikey': AUTH_KEY,
      'Authorization': `Bearer ${AUTH_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`storageUpload ${res.status}: ${text}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/images/${storagePath}`;
}

// ─── 이미지 다운로드 + WebP 변환 ──────────────────────────────────────────────
async function downloadAndConvert(url, storagePath) {
  // 다운로드
  const res = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MHJ-Image-Bot/1.0)',
    }
  });
  if (!res.ok) throw new Error(`이미지 다운로드 실패 HTTP ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());

  // WebP 변환 (max 1200px, quality 85)
  const webpBuffer = await sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  return webpBuffer;
}

// ─── Playwright로 이미지 수집 ─────────────────────────────────────────────────
async function scrapeImages(page, slug) {
  const url = `${FRAMER_BASE}/${slug}`;
  console.log(`  🌐 접속: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    // timeout이어도 부분 로드된 상태에서 계속
    console.log(`  ⚠️  로드 타임아웃 (부분 로드로 계속): ${e.message.slice(0, 60)}`);
  }

  // 이미지 lazy-load를 위해 스크롤
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let pos = 0;
      const interval = setInterval(() => {
        window.scrollBy(0, 300);
        pos += 300;
        if (pos > document.body.scrollHeight) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  });
  await page.waitForTimeout(2000);

  // 이미지 수집
  const images = await page.evaluate(() => {
    const results = [];

    // 본문 영역 탐색 — Framer는 main, article, [data-framer-component-type] 등 사용
    // 전략: 모든 img 수집 후 hero/OG 이미지 제외
    const allImgs = Array.from(document.querySelectorAll('img'));

    // 커버/썸네일 이미지 판별:
    // 1) 페이지 첫 번째 큰 이미지 (보통 hero)
    // 2) og:image와 같은 이미지
    const ogImageMeta = document.querySelector('meta[property="og:image"]');
    const ogImageUrl = ogImageMeta?.getAttribute('content') || '';

    // 이미지 크기, 위치 기반 필터링
    for (const img of allImgs) {
      const rect = img.getBoundingClientRect();
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      // src 또는 srcset에서 최고해상도 URL 추출
      let imgSrc = img.src || '';

      // srcset 파싱 — 가장 큰 너비 URL 선택
      if (img.srcset) {
        const entries = img.srcset.split(',').map(s => {
          const parts = s.trim().split(/\s+/);
          const url = parts[0];
          const w = parts[1] ? parseInt(parts[1]) : 0;
          return { url, w };
        });
        entries.sort((a, b) => b.w - a.w);
        if (entries.length > 0) imgSrc = entries[0].url;
      }

      // data-src (lazy load)
      if (!imgSrc && img.getAttribute('data-src')) {
        imgSrc = img.getAttribute('data-src');
      }

      if (!imgSrc) continue;
      if (!imgSrc.startsWith('http')) continue;
      // SVG, gif, 아이콘 크기 제외
      if (imgSrc.includes('.svg')) continue;
      if (naturalW > 0 && naturalW < 100) continue;
      if (naturalH > 0 && naturalH < 100) continue;
      // Framer 본문 이미지만 — 외부 위젯(뉴스레터, RSS 등) 제외
      if (!imgSrc.includes('framerusercontent.com')) continue;

      // OG 이미지와 동일한 경우 (커버) 제외
      // framer URL은 파라미터가 다를 수 있으므로 path prefix 비교
      const isOg = ogImageUrl && (
        imgSrc.includes(ogImageUrl.split('?')[0].slice(-40)) ||
        ogImageUrl.includes(imgSrc.split('?')[0].slice(-40))
      );

      // 위치 기반: viewport 상단 300px 이내에서 전폭에 가까운 이미지 = 커버
      const isHero = rect.top < 400 && rect.width > window.innerWidth * 0.7;

      // 캡션 찾기: 인접 figcaption, 또는 다음 형제 텍스트 노드
      let caption = '';
      const figcaption = img.closest('figure')?.querySelector('figcaption');
      if (figcaption) caption = figcaption.textContent.trim();

      results.push({
        src: imgSrc,
        naturalWidth: naturalW,
        naturalHeight: naturalH,
        offsetTop: img.getBoundingClientRect().top + window.scrollY,
        isOg,
        isHero,
        caption,
        alt: img.alt || '',
      });
    }

    return results;
  });

  // 커버/히어로/OG 이미지 제외
  const bodyImages = images.filter(img => !img.isOg && !img.isHero);

  // 위치 순서 정렬
  bodyImages.sort((a, b) => a.offsetTop - b.offsetTop);

  // 중복 제거 (같은 src)
  const seen = new Set();
  const unique = bodyImages.filter(img => {
    const key = img.src.split('?')[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique;
}

// ─── blockquote 카운트 헬퍼 ────────────────────────────────────────────────────
function countBlockquotes(content) {
  const matches = content.match(/<blockquote>/g);
  return matches ? matches.length : 0;
}

function extractBlockquoteTexts(content) {
  const matches = [...content.matchAll(/<blockquote>\s*<p>([\s\S]*?)<\/p>\s*<\/blockquote>/g)];
  return matches.map(m => m[1].trim());
}

// ─── n번째 blockquote를 figure로 교체 ──────────────────────────────────────────
function replaceNthBlockquote(content, index, imgUrl, caption) {
  let count = 0;
  return content.replace(/<blockquote>\s*<p>([\s\S]*?)<\/p>\s*<\/blockquote>/g, (match, text) => {
    if (count === index) {
      count++;
      const altText = caption || text.trim();
      return `<figure class="blog-body-image">
  <img src="${imgUrl}" alt="${altText.replace(/"/g, '&quot;')}" loading="lazy" />
  <figcaption>${altText}</figcaption>
</figure>`;
    }
    count++;
    return match;
  });
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('🖼️  Framer 본문 이미지 이전 시작');
  console.log(`📋 대상: ${targetBlogs.length}개 글`);
  if (dryRun) console.log('⚠️  DRY-RUN 모드 (DB/Storage 변경 없음)\n');
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const report = {
    success: [],
    skipped: [],
    failed: [],
    details: [],
  };

  for (const blog of targetBlogs) {
    console.log(`\n━━━ [${blog.id}] ${blog.slug} ━━━`);

    let detail = { id: blog.id, slug: blog.slug, images: [], blockquotes: 0, replaced: 0, errors: [] };

    try {
      // ① DB에서 현재 content 조회
      const row = await dbGetBlog(blog.id);
      if (!row) {
        console.log(`  ⚠️  DB에서 글을 찾을 수 없음 (건너뜀)`);
        report.skipped.push(blog.slug);
        continue;
      }

      const bqCount = countBlockquotes(row.content || '');
      const bqTexts = extractBlockquoteTexts(row.content || '');
      detail.blockquotes = bqCount;
      console.log(`  📝 blockquote 수: ${bqCount}`);
      if (bqTexts.length > 0) {
        bqTexts.forEach((t, i) => console.log(`     [${i}] "${t.slice(0, 60)}"`));
      }

      // ② Playwright로 이미지 수집
      const scraped = await scrapeImages(page, blog.slug);
      console.log(`  📸 수집된 이미지: ${scraped.length}개`);
      scraped.forEach((img, i) => {
        console.log(`     [${i}] ${img.src.slice(0, 80)}`);
        if (img.caption) console.log(`         caption: "${img.caption}"`);
      });

      if (scraped.length === 0) {
        // id 15, 16 같이 실제 인용문 blockquote인 경우 — 이미지 없으면 건너뜀
        if (bqCount === 0) {
          console.log(`  ✅ blockquote 없고 이미지도 없음 — 건너뜀`);
          report.skipped.push(blog.slug);
        } else {
          console.log(`  ⚠️  이미지 수집 실패 또는 이미지 없음 — blockquote 유지`);
          report.skipped.push(blog.slug);
          detail.errors.push('이미지 수집 결과 0개');
        }
        report.details.push(detail);
        continue;
      }

      // ③ 매칭 로직
      // blockquote 수와 이미지 수 비교
      // 이미지 수 >= blockquote 수: 1:1 매핑 (순서 기준)
      // 이미지 수 < blockquote 수: 일부만 교체
      const pairCount = Math.min(scraped.length, bqCount);

      let updatedContent = row.content || '';
      const uploadedUrls = [];

      // ④ 이미지 다운로드 → WebP → Storage 업로드
      for (let i = 0; i < scraped.length; i++) {
        const imgInfo = scraped[i];
        const nn = String(i + 1).padStart(2, '0');
        const storagePath = `blog/blog-${blog.id}-body-${nn}.webp`;

        process.stdout.write(`  ⬆️  [${nn}] 업로드 중... `);

        try {
          if (!dryRun) {
            const webpBuffer = await downloadAndConvert(imgInfo.src, storagePath);
            const publicUrl = await storageUpload(storagePath, webpBuffer);
            uploadedUrls.push({ url: publicUrl, caption: imgInfo.caption || imgInfo.alt });
            console.log(`✅ ${publicUrl.slice(-50)}`);
          } else {
            uploadedUrls.push({ url: `[DRY-RUN]${storagePath}`, caption: imgInfo.caption || imgInfo.alt });
            console.log(`[DRY-RUN]`);
          }
          detail.images.push({ index: i, src: imgInfo.src, stored: storagePath });
        } catch (e) {
          console.log(`⚠️  실패: ${e.message}`);
          detail.errors.push(`이미지 ${nn} 업로드 실패: ${e.message}`);
          uploadedUrls.push(null);
        }
      }

      // ⑤ DB content 백업 + blockquote 교체
      if (bqCount > 0 && uploadedUrls.filter(Boolean).length > 0) {
        // n번째 blockquote → n번째 이미지 교체
        for (let i = 0; i < pairCount; i++) {
          if (!uploadedUrls[i]) continue; // 업로드 실패한 이미지 건너뜀

          const bqCaption = bqTexts[i] || '';
          const imgCaption = uploadedUrls[i].caption || bqCaption;
          // blockquote 텍스트와 이미지 캡션 교차 검증 (로그용)
          if (bqCaption && imgCaption && bqCaption !== imgCaption) {
            console.log(`  ℹ️  [${i}] 캡션 불일치: DB="${bqCaption.slice(0, 40)}" | Framer="${imgCaption.slice(0, 40)}"`);
          }

          // DB 캡션 텍스트 사용 (더 신뢰할 수 있음)
          const finalCaption = bqCaption || imgCaption;
          updatedContent = replaceNthBlockquote(updatedContent, 0, uploadedUrls[i].url, finalCaption);
          detail.replaced++;
        }

        if (!dryRun) {
          const payload = { content: updatedContent };
          // 처음 교체할 때만 백업 저장
          if (!row.content_backup) {
            payload.content_backup = row.content;
          }
          await dbUpdate(blog.id, payload);
          console.log(`  ✅ DB 업데이트: ${detail.replaced}개 blockquote → figure 교체`);
        } else {
          console.log(`  [DRY-RUN] DB 업데이트 건너뜀 (교체 예정: ${detail.replaced}개)`);
        }

        report.success.push(blog.slug);
      } else if (bqCount === 0 && scraped.length > 0) {
        // blockquote는 없지만 이미지가 있는 경우 (id 19 등) — 로그만 기록
        console.log(`  ℹ️  blockquote 없음, 이미지 ${scraped.length}개 발견 → content 수정 불필요`);
        report.skipped.push(blog.slug);
      } else {
        console.log(`  ⚠️  교체 불가 (bq=${bqCount}, 업로드성공=${uploadedUrls.filter(Boolean).length})`);
        report.skipped.push(blog.slug);
      }

    } catch (e) {
      console.log(`  ❌ 오류: ${e.message}`);
      detail.errors.push(e.message);
      report.failed.push({ slug: blog.slug, error: e.message });
    }

    report.details.push(detail);

    // 요청 간격
    await page.waitForTimeout(1500);
  }

  await browser.close();

  // ─── 최종 리포트 ──────────────────────────────────────────────────────────
  console.log('\n\n══════════════════════════════════════════════');
  console.log('📊 이전 완료 보고서');
  console.log('══════════════════════════════════════════════');
  console.log(`✅ 성공: ${report.success.length}개 → ${report.success.join(', ')}`);
  console.log(`⏭️  건너뜀: ${report.skipped.length}개 → ${report.skipped.join(', ')}`);
  if (report.failed.length > 0) {
    console.log(`❌ 실패: ${report.failed.length}개`);
    report.failed.forEach(f => console.log(`   - ${f.slug}: ${f.error}`));
  }

  const totalReplaced = report.details.reduce((s, d) => s + (d.replaced || 0), 0);
  const totalImages = report.details.reduce((s, d) => s + (d.images?.length || 0), 0);
  console.log(`\n📸 총 이미지: ${totalImages}개 업로드, ${totalReplaced}개 blockquote 교체`);

  // 로그 저장
  const logPath = path.join(OUTPUT_DIR, `migrate-body-${Date.now()}.json`);
  writeFileSync(logPath, JSON.stringify(report, null, 2));
  console.log(`📁 상세 로그: ${logPath}`);

  // ─── 검증 ─────────────────────────────────────────────────────────────────
  if (!dryRun) {
    console.log('\n🔍 검증 중...');
    let remainingBq = 0;
    for (const blog of targetBlogs) {
      const row = await dbGetBlog(blog.id);
      const bq = countBlockquotes(row?.content || '');
      if (bq > 0) {
        console.log(`  ⚠️  [${blog.id}] ${blog.slug}: blockquote ${bq}개 남음`);
        remainingBq += bq;
      }
    }
    if (remainingBq === 0) {
      console.log('  ✅ 모든 blockquote 제거 완료');
    } else {
      console.log(`  ⚠️  총 ${remainingBq}개 blockquote 미처리 (이미지 수집 실패 또는 실제 인용문)`);
    }
  }
}

main().catch(e => {
  console.error('❌ 치명 오류:', e);
  process.exit(1);
});
