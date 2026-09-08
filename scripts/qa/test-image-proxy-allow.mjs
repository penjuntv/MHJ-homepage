#!/usr/bin/env node
// lib/image-proxy-allow.mjs 판정 실증 — SSRF 차단이 실제로 거부하는지.
import { isAllowedImageUrl as ok } from '../../lib/image-proxy-allow.mjs';
const SB = 'https://vpayqdatpqajsmalpfmq.supabase.co';
const cases = [
  ['Storage 공개 경로 허용', ok(`${SB}/storage/v1/object/public/images/blogs/a.jpg`, SB), true],
  ['비공개 Storage 경로 거부', ok(`${SB}/storage/v1/object/sign/x.jpg`, SB), false],
  ['다른 호스트 거부', ok('https://evil.example/storage/v1/object/public/a.jpg', SB), false],
  ['http 거부', ok(`http://vpayqdatpqajsmalpfmq.supabase.co/storage/v1/object/public/a.jpg`, SB), false],
  ['사설 IP 거부', ok('http://169.254.169.254/latest/meta-data', SB), false],
  ['localhost 거부', ok('https://localhost/storage/v1/object/public/a.jpg', SB), false],
  ['호스트 앞에 인증정보 거부', ok(`https://u:p@vpayqdatpqajsmalpfmq.supabase.co/storage/v1/object/public/a.jpg`, SB), false],
  ['깨진 URL 거부', ok('not a url', SB), false],
];
let failed = 0;
for (const [n, got, want] of cases) { const p = got === want; if (!p) failed++; console.log(`${p ? '✅' : '🔴'} ${n}`); }
console.log(failed ? `🔴 ${failed} 실패` : `✅ ${cases.length}/${cases.length}`); process.exit(failed ? 1 : 0);
