# MHJ SEO Patch — 2026-05-30
## Claude Code 실행 프롬프트 모음

> 이 패치는 **4개의 작은 PR**로 나눠 적용한다. 1 conversation = 1 feature 원칙을 따른다.
> 각 프롬프트는 새 Claude Code 세션에서 실행하고, 빌드 통과 후 커밋 → push → Vercel 확인 → 다음 프롬프트로.
>
> 모델: Sonnet (단순 파일 수정 위주, Opus 불필요)
> 모드: Plan Mode 먼저 → 승인 → 실행

---

## 사전 점검 (한 번만)

작업 시작 전 새 브랜치 분기:

```bash
cd MHJ-homepage
git checkout -b seo-patch-2026-05-30
```

---

## PR 1 — `app/robots.ts` 갱신 + sitemap revalidate 완화

### 프롬프트 (Claude Code 에 붙여넣기)

```
다음 두 파일을 교체한다.

작업 1: app/robots.ts 를 첨부 파일과 동일하게 교체.
변경 핵심: AI 봇 (GPTBot, ClaudeBot, PerplexityBot 등) 명시 allow 룰 12개 추가,
Bytespider/ImagesiftBot 명시 deny, /api 와 /unsubscribe 도 disallow 에 추가.

작업 2: app/sitemap.ts 를 첨부 파일과 동일하게 교체.
변경 핵심: `export const dynamic = 'force-dynamic'` 제거,
`export const revalidate = 3600` 으로 교체. 함수 본문은 동일.

작업 3: 빌드 통과 확인.
```bash
rm -rf .next
npm run build
```

작업 4: 새 robots 출력 검증.
빌드 결과 .next/build-manifest.json 또는 next start 후 curl 로
http://localhost:3003/robots.txt 결과를 보여줘. AI 봇 12개 명시 allow + 2개 deny 확인.

작업 5: 커밋
```bash
git add app/robots.ts app/sitemap.ts
git commit -m "seo: explicit AI bot policy + sitemap revalidate 1h"
git push origin seo-patch-2026-05-30
```

참조 문서:
- CLAUDE.md 의 "핵심 규칙"
- docs/ARCHITECTURE.md

주의:
- 다른 파일 수정 금지 (1 PR = 2 file).
- robots.ts 의 host 필드는 Next.js 14 MetadataRoute.Robots 가 지원하므로 그대로 둘 것.
- .next 캐시 클리어 필수 (sitemap.ts 의 dynamic 모드 변경 때문에 캐시 충돌 가능).
```

---

## PR 2 — `app/llms.txt` + `app/llms-full.txt` 라우트 신규

### 프롬프트

```
새 라우트 두 개를 추가한다.

작업 1: 디렉토리 생성
- app/llms.txt/
- app/llms-full.txt/

작업 2: 첨부 파일 두 개를 그대로 복사
- app/llms.txt/route.ts
- app/llms-full.txt/route.ts

작업 3: 빌드 통과 확인
```bash
rm -rf .next
npm run build
```

빌드 결과에 `λ /llms.txt` 와 `λ /llms-full.txt` 가 라우트로 잡혀야 한다.

작업 4: 로컬에서 라우트 응답 검증
dev 서버 띄우고:
```bash
curl -sI http://localhost:3003/llms.txt | head -5
curl -sI http://localhost:3003/llms-full.txt | head -5
```
둘 다 200 OK + Content-Type: text/markdown 이어야 한다.

```bash
curl -s http://localhost:3003/llms.txt | head -40
```
- `# MHJ — My Mairangi Journal` 타이틀
- Featured blogs 섹션에 글이 들어있나 (없으면 view_count 상위로 폴백)
- Last updated 날짜가 오늘인가

작업 5: 커밋
```bash
git add app/llms.txt app/llms-full.txt
git commit -m "seo: add /llms.txt and /llms-full.txt routes for GEO/AEO"
git push origin seo-patch-2026-05-30
```

참조 문서:
- docs/DB_SCHEMA.md (blogs / magazines / articles / newsletters 컬럼 확인)
- CLAUDE.md

주의:
- lib/supabase 의 anon client 사용 (anon 으로 published 글만 select 됨, RLS OK)
- YuStudy 테이블 절대 조회 금지 (같은 Supabase 프로젝트에 공존)
- Whānau 의 마크롱 (ā) 이 escape 되지 않게. UTF-8 그대로.
- 다른 파일 수정 금지.
```

---

## PR 3 — StoryPress FAQPage schema

### 프롬프트

```
첨부된 patches/storypress-faq-schema.md 의 절차를 그대로 따른다.

작업 1: 새 파일 lib/storypress-faqs.ts 생성.
내용은 patches/storypress-faq-schema.md 의 "Step 1" 코드 블록 그대로.

작업 2: components/StoryPressFAQ.tsx 수정.
- 기존 `const FAQS = [ ... ]` 상수 블록 (7개 객체) 삭제
- 파일 상단 import 영역에 추가: `import { STORYPRESS_FAQS as FAQS } from '@/lib/storypress-faqs';`
- 컴포넌트 본문은 변경 금지

작업 3: app/(public)/storypress/page.tsx 수정.
- 파일 상단 import 영역에 추가: `import { STORYPRESS_FAQS } from '@/lib/storypress-faqs';`
- 기존 `const jsonLd = { ... SoftwareApplication ... }` 정의 바로 다음에 `faqJsonLd` 정의 추가
  (patches/storypress-faq-schema.md 의 Step 3 코드 블록 그대로)
- 기존 두 개의 `<script type="application/ld+json">` 블록 다음에 세 번째 블록 추가 (faqJsonLd 직렬화)

작업 4: 빌드 + 타입 체크
```bash
rm -rf .next
npm run build
```
타입 에러 0개.

작업 5: 로컬 검증
```bash
curl -s http://localhost:3003/storypress | grep -A 2 "FAQPage"
```
응답에 `"@type":"FAQPage"` 와 7개의 `"@type":"Question"` 포함되어야 한다.

작업 6: 커밋
```bash
git add lib/storypress-faqs.ts components/StoryPressFAQ.tsx app/\(public\)/storypress/page.tsx
git commit -m "seo: add FAQPage JSON-LD to /storypress (7 Q&A)"
git push origin seo-patch-2026-05-30
```

참조 문서:
- patches/storypress-faq-schema.md (절차)
- docs/ARCHITECTURE.md (page.tsx 패턴)

주의:
- FAQS 텍스트 한 글자도 수정 금지 (UI 와 schema 가 동일 내용 가져야 Google 가이드라인 만족)
- `'use client'` 가 StoryPressFAQ.tsx 상단에 있는데, plain object import 는 안전
- 다른 페이지 schema 건드리지 마.
```

---

## PR 4 — `.claude/skills/` 3개 스킬 추가

### 프롬프트

```
새 스킬 디렉토리 3개를 추가한다.

작업 1: 첨부 파일 그대로 복사
- .claude/skills/llms-txt-generator/SKILL.md
- .claude/skills/seo-audit-runner/SKILL.md
- .claude/skills/internal-link-suggester/SKILL.md

작업 2: skills-lock.json 갱신
기존 .claude/skills 의 6개 (yussi-factory, blog-publish-preflight, design-rules-audit,
frontend-design, newsletter-composer, cc-prompt-gen) + 새 3개 = 9개로 lock 파일 갱신.

JSON 구조 그대로 유지하면서 새 entry 3개 추가:
```json
{
  "skills": [
    ... 기존 6개 ...,
    { "name": "llms-txt-generator", "version": "1.0.0", "added": "2026-05-30" },
    { "name": "seo-audit-runner", "version": "1.0.0", "added": "2026-05-30" },
    { "name": "internal-link-suggester", "version": "1.0.0", "added": "2026-05-30" }
  ]
}
```

기존 skills-lock.json 의 정확한 구조를 view 한 뒤 따라가도록. 위 예시는 형식 가이드일 뿐.

작업 3: docs/AGENTS.md 에 새 스킬 3개 한 줄씩 추가.
기존 AGENTS.md 의 "스킬 목록" 섹션에 다음 줄 추가:

- `llms-txt-generator` — /llms.txt 동적 라우트 점검·검증
- `seo-audit-runner` — 발행 콘텐츠 SEO 감사 보고서 자동 생성
- `internal-link-suggester` — 발행 시 내부 링크 후보 추천

작업 4: 빌드는 변화 없으므로 생략 가능. lint 통과만 확인.

작업 5: 커밋
```bash
git add .claude/skills skills-lock.json docs/AGENTS.md
git commit -m "skills: add llms-txt-generator, seo-audit-runner, internal-link-suggester"
git push origin seo-patch-2026-05-30
```

주의:
- 코드 파일 (app/, components/, lib/) 절대 수정 금지. 이 PR 은 스킬 추가만.
- 기존 6개 스킬의 SKILL.md 도 수정 금지.
```

---

## PR 머지 후 최종 점검 체크리스트

4개 PR 모두 머지 후 Vercel production 에서 다음 확인:

```bash
# 1. AI 봇 정책
curl -s https://www.mhj.nz/robots.txt | grep -E "GPTBot|ClaudeBot|PerplexityBot"

# 2. LLM 인덱스 라우트
curl -sI https://www.mhj.nz/llms.txt
curl -sI https://www.mhj.nz/llms-full.txt

# 3. FAQ schema
curl -s https://www.mhj.nz/storypress | grep -c "FAQPage"
# 결과: 1 이어야 함

# 4. sitemap 캐시
curl -sI https://www.mhj.nz/sitemap.xml | grep -i "cache"
# Cache-Control 에 max-age=3600 or stale-while-revalidate 확인

# 5. revalidate 트리거 (선택)
curl -X POST https://www.mhj.nz/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"'"$REVALIDATION_SECRET"'","paths":["/llms.txt","/llms-full.txt","/sitemap.xml","/storypress"]}'
```

마지막으로:
- GSC → 색인 생성 → 페이지 → "Sitemap 확인" 에서 sitemap.xml 재제출
- GSC → URL 검사 → `https://www.mhj.nz/llms.txt` 입력 후 "색인 요청" (선택)
- 3주 후 Vercel runtime log 에서 GPTBot / ClaudeBot / PerplexityBot 의 /llms.txt 접근 빈도 확인

---

## 적용 후 후속 작업 (별도 세션)

이 패치는 **기술적 인프라**만 다룬다. 진짜 SEO 효과는 다음 작업에서 나온다:

1. `seo-audit-runner` 스킬 실행 → docs/seo-audit-2026-05-XX.md 생성
2. 보고서 top 10 worst 블로그를 Yussi 와 함께 정비:
   - thin content 800자 확장
   - H2 2~5개 추가
   - 지역 키워드 (Mairangi/Auckland/NZ) 본문 삽입
   - alt 텍스트 채우기
3. `internal-link-suggester` 로 신규 발행마다 3~5개 링크 자동 추천
4. 3개월 후 GSC 색인율·노출 추이 재측정

---

*패치 작성: 2026-05-30 by PeNnY + Claude*
