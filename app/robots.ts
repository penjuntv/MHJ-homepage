import { MetadataRoute } from 'next';

/**
 * MHJ robots policy — 2026-05-30
 *
 * Phase A1 of the SEO patch.
 *
 * 의도:
 * - 전통적 검색엔진 + AI 답변 엔진 모두에게 명시적으로 크롤링 허용
 * - 인용(citation)은 환영, 학습 데이터 수집은 선택권 유지
 * - 비공개/리다이렉트/필터 페이지는 명시적으로 disallow
 *
 * 정책 결정:
 * - GPTBot, ClaudeBot, Google-Extended (학습용) → allow
 *   이유: MHJ는 "Korean immigrant family Auckland" 같은 롱테일 질문에
 *   거의 유일한 한국어 답이 될 수 있는 niche. 인용·학습 모두 가치 있음.
 * - ChatGPT-User, Claude-User, PerplexityBot (실시간 인용) → allow
 *   이유: AI 답변 엔진에서 사용자 질문 시점에 우리 페이지 fetch 후 citation 생성.
 *   GEO/AEO 핵심 트래픽 경로.
 * - CCBot (Common Crawl) → allow
 *   이유: 다수 LLM의 사전학습 데이터 파이프라인.
 * - Meta-ExternalAgent → allow
 *   이유: Meta AI 인용에 사용. niche 답변으로서 가치 보존.
 * - Bytespider (ByteDance/TikTok) → disallow
 *   이유: 콘텐츠 라이선스·국가 관할 불투명.
 *
 * Disallow 경로:
 * - /admin, /mhj-desk: 관리자 UI (Google OAuth + MFA)
 * - /go: 어필리에이트 리다이렉트 (rel=sponsored, 인덱싱 무의미)
 * - /blog/tag/: thin/duplicate 신호 (메모리상 noindex 처리 완료)
 * - /api: 내부 API 엔드포인트
 * - /unsubscribe: 개인화 URL
 */
export default function robots(): MetadataRoute.Robots {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mhj.nz';
  const PRIVATE_PATHS = [
    '/admin',
    '/mhj-desk',
    '/go',
    '/blog/tag/',
    '/api/',
    '/unsubscribe',
  ];

  // 명시적 allow AI 봇 (인용 + 학습용 모두 포함)
  const FRIENDLY_AI_BOTS = [
    'GPTBot',          // OpenAI 학습용
    'ChatGPT-User',    // ChatGPT 실시간 fetch (인용)
    'OAI-SearchBot',   // SearchGPT
    'ClaudeBot',       // Anthropic 학습용
    'Claude-User',     // Claude 실시간 fetch (인용)
    'PerplexityBot',   // Perplexity (llms.txt 공식 지원)
    'Google-Extended', // Gemini 학습용
    'Applebot-Extended', // Apple Intelligence
    'CCBot',           // Common Crawl (다수 LLM 파이프라인)
    'Meta-ExternalAgent', // Meta AI
    'cohere-ai',       // Cohere
    'Diffbot',         // 다수 검색·요약 도구
  ];

  // 명시적 disallow (콘텐츠 라이선스·관할 불투명)
  const BLOCKED_AI_BOTS = ['Bytespider', 'ImagesiftBot'];

  const allowAiBots = FRIENDLY_AI_BOTS.map((userAgent) => ({
    userAgent,
    allow: '/',
    disallow: PRIVATE_PATHS,
  }));

  const blockAiBots = BLOCKED_AI_BOTS.map((userAgent) => ({
    userAgent,
    disallow: '/',
  }));

  return {
    rules: [
      // 1. 기본 — 모든 봇 (Googlebot, Bingbot 등 포함)
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      // 2. AI 봇 — 명시적 allow (Cloudflare 등 미들웨어의 기본 차단 회피)
      ...allowAiBots,
      // 3. AI 봇 — 명시적 deny
      ...blockAiBots,
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
