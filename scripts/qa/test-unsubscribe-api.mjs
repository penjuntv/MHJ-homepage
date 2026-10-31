#!/usr/bin/env node
/**
 * /api/unsubscribe 보안 회귀 검사 (2026-10-31).
 * 지키는 것: 이메일만으로는 해지되지 않는다(확인 메일 경로 `sent`), 모르는·틀린 토큰은 404,
 * GET 은 상태를 안 바꾸고 확인 페이지로 303.
 * 실제 구독자를 건드리지 않게 존재하지 않는 example.com 주소와 0 토큰만 쓴다(메일도 안 나간다).
 *
 *   node scripts/qa/test-unsubscribe-api.mjs --base=http://localhost:3013
 */
const base = (process.argv.find((a) => a.startsWith('--base='))?.slice(7)) || 'http://localhost:3013';
const ZERO = '00000000-0000-4000-8000-000000000000';
let failed = 0;

function check(label, ok, detail) {
  console.log(`${ok ? '✅' : '❌'} ${label}${ok ? '' : ` — ${detail}`}`);
  if (!ok) failed++;
}

async function post(path, body, type = 'application/json') {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: body === undefined ? {} : { 'Content-Type': type },
    body: body === undefined ? undefined : (type === 'application/json' ? JSON.stringify(body) : body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

let r = await post('/api/unsubscribe', { email: `qa-nobody-${Date.now()}@example.com` });
check('이메일만 → 바로 해지 아님(확인 메일 경로)', r.status === 200 && r.json?.sent === true && !('already' in (r.json ?? {})), JSON.stringify(r));

r = await post('/api/unsubscribe', { token: ZERO });
check('모르는 토큰 → 404', r.status === 404, JSON.stringify(r));

r = await post('/api/unsubscribe?token=not-a-uuid', undefined);
check('형식 틀린 토큰 → 404', r.status === 404, JSON.stringify(r));

r = await post(`/api/unsubscribe?token=${ZERO}`, 'List-Unsubscribe=One-Click', 'application/x-www-form-urlencoded');
check('원클릭(form) 모르는 토큰 → 404', r.status === 404, JSON.stringify(r));

r = await post('/api/unsubscribe', {});
check('빈 요청 → 400', r.status === 400, JSON.stringify(r));

const g = await fetch(`${base}/api/unsubscribe?token=${ZERO}`, { redirect: 'manual' });
check('GET → 303 확인 페이지(상태 변경 없음)', g.status === 303 && (g.headers.get('location') ?? '').includes(`/unsubscribe?token=${ZERO}`), `${g.status} ${g.headers.get('location')}`);

process.exit(failed ? 1 : 0);
