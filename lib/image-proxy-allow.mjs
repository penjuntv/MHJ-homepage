/**
 * /api/carousel/proxy-image 가 대신 가져와도 되는 URL 판정 — SSRF 차단.
 * 호출처(components/carousel/v2/{ExportEngine,LivePreview}.tsx)는 `supabase.co` 가 든 src 만 프록시로 보낸다.
 * 여기서는 그중 이 프로젝트의 Storage **공개** 경로(object/public, render/image/public)만 허용하고
 * 사설 IP·localhost·http·다른 호스트·서명 URL 은 관리자 세션이 있어도 거부한다.
 * next.config.mjs images.remotePatterns 의 `*.supabase.co /storage/v1/object/public/**` 와 같은 정책 — 버킷·호스트가
 * 바뀌면 두 곳을 함께 고친다.
 * .mjs 인 이유: 라우트(TS)와 scripts/qa 테스트(node)가 같은 판정을 쓰게.
 */
const PUBLIC_PREFIXES = ['/storage/v1/object/public/', '/storage/v1/render/image/public/'];

export function isAllowedImageUrl(raw, supabaseUrl) {
  let u;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== 'https:') return false;
  if (u.username || u.password) return false;
  let host;
  try { host = new URL(supabaseUrl).host; } catch { return false; }
  if (u.host !== host) return false;
  return PUBLIC_PREFIXES.some((p) => u.pathname.startsWith(p));
}
