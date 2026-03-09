/**
 * MHJ HOMEPAGE — Supabase 시드 데이터 삽입 스크립트
 *
 * 사용법:
 *   node seed-data/seed.mjs
 *
 * 필요 조건:
 *   - .env.local에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정 완료
 *   - Supabase에서 setup.sql 실행 완료 (테이블 생성)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ─── .env.local 수동 파싱 ─── */
function loadEnv() {
  const envPath = join(__dirname, '../.env.local');
  try {
    const raw = readFileSync(envPath, 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.error('❌ .env.local 파일을 찾을 수 없습니다.');
    process.exit(1);
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || url.includes('your-project') || !key || key.includes('your-')) {
  console.error('❌ .env.local에 실제 Supabase 값을 입력하세요.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJ...');
  process.exit(1);
}

const supabase = createClient(url, key);

/* ─── JSON 읽기 헬퍼 ─── */
function readJson(filename) {
  return JSON.parse(readFileSync(join(__dirname, filename), 'utf-8'));
}

/* ─── 메인 ─── */
async function seed() {
  console.log('🌱 MHJ HOMEPAGE — 시드 데이터 삽입 시작\n');

  /* 1. magazines */
  const magazines = readJson('magazines.json');
  const { error: e1 } = await supabase
    .from('magazines')
    .upsert(magazines, { onConflict: 'id' });
  if (e1) {
    console.error('❌ magazines 오류:', e1.message);
  } else {
    console.log(`✅ magazines: ${magazines.length}개 삽입 완료`);
  }

  /* 2. articles (magazine_id 기준 중복 방지: 기존 삭제 후 삽입) */
  const articles = readJson('articles.json');
  const magazineIds = [...new Set(articles.map(a => a.magazine_id))];

  for (const mid of magazineIds) {
    await supabase.from('articles').delete().eq('magazine_id', mid);
  }

  const { error: e2 } = await supabase
    .from('articles')
    .insert(articles);
  if (e2) {
    console.error('❌ articles 오류:', e2.message);
  } else {
    console.log(`✅ articles: ${articles.length}개 삽입 완료`);
  }

  /* 3. blogs (slug 기준 upsert) */
  const blogs = readJson('blogs.json');
  const { error: e3 } = await supabase
    .from('blogs')
    .upsert(blogs, { onConflict: 'slug' });
  if (e3) {
    console.error('❌ blogs 오류:', e3.message);
  } else {
    console.log(`✅ blogs: ${blogs.length}개 삽입 완료`);
  }

  /* 4. family_members (전체 교체) */
  const family = readJson('family.json');
  await supabase.from('family_members').delete().neq('id', 0);

  const { error: e4 } = await supabase
    .from('family_members')
    .insert(family);
  if (e4) {
    console.error('❌ family_members 오류:', e4.message);
  } else {
    console.log(`✅ family_members: ${family.length}개 삽입 완료`);
  }

  console.log('\n🎉 시드 완료! 이제 npm run dev로 사이트를 확인하세요.');
}

seed().catch((err) => {
  console.error('❌ 예기치 못한 오류:', err.message);
  process.exit(1);
});
