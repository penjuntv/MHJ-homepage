# 보고서 — mhj.nz/storypress 랜딩 카피 동기화 (홈페이지 세션 → StoryPress CC)

- 작성: 2026-07-05 / 세션: MHJ_HOMEPAGE (mhj.nz 홈페이지 레포)
- 대상 독자: app.mhj.nz(StoryPress 앱)를 담당하는 StoryPress Claude Code / PeNnY

## 1. 결론: app.mhj.nz는 전혀 건드리지 않았음
이 세션은 처음부터 끝까지 `/Users/penny/MHJ_HOMEPAGE`(mhj.nz 홈페이지 레포)
안에서만 작업했습니다. app.mhj.nz(별도 프로젝트/레포)의 코드·설정·DB·config에는
접근한 적이 없습니다. 특히 앱의 가격 SSOT(`config/pricing.ts`)는 열지도 않았습니다.

## 2. 이 세션이 홈페이지 쪽에서 실제로 바꾼 것 (전체 원장)

### (A) 커밋·푸시·라이브 배포됨 — commit `56a7ed2` (main)
- `app/(public)/storypress/StoryPressClient.tsx` — 히어로/Features/How It Works/
  Library/Research/Our Story/인용 카피를 app.mhj.nz 정본에 동기화.
  ESOL·immigrant 프레이밍, 이모지 국기 카드, "Made for Families"·"Built by a mom"
  제거. Yussi 1인칭 창업자 보이스로 교체. 다크모드 대비 수정(Our Story 헤드라인 +
  샘플북 제목: 라이트 아일랜드 → 고정 잉크 #1A1A1A). Our Story 좌측을 풀쿼트로 재균형.
- `app/(public)/storypress/page.tsx` — meta/og/twitter description, jsonLd audienceType
  에서 ESOL 제거, 정본 톤으로 통일.
- `lib/storypress-faqs.ts` — FAQ 재작성. **가격 하드코딩($5.99/month) 전면 제거** →
  "pricing is always shown inside the app"로 대체(가격 SSOT를 앱에 위임). 14+/40+ 수치 제거.
- 배포 확인: www.mhj.nz/storypress 에 "Every child has a story", "Built to be made",
  "We built this for our daughter", "An Auckland family" 노출 / "ESOL"·이모지 소거 확인.

### (B) 라이브 DB 변경 (홈페이지 Supabase, 프로젝트 vpayqdatpqajsmalpfmq)
- `site_settings` 테이블 `storypress_title` 1행 UPDATE:
  `"StoryPress"` → `"Every child has a story.\nLet them write it."`
  (히어로 H1은 이 DB값으로 렌더됨. 45행 중 이 1행만 변경, 총 행수 45→45 무증감 검증 완료.)
- `storypress_description`은 빈 값 유지(변경 안 함).
- ※ 이 DB는 홈페이지 소유 Supabase입니다. app.mhj.nz의 DB가 아닙니다.

### (C) 커밋하지 않고 작업 트리에 남겨둔 것 (이 세션이 만든 것 아님 / 렉·캐싱 배치용)
아래는 **세션 시작 전부터 존재하던 미커밋 WIP**로, 홈페이지 "렉" 완화를 겨냥한
성능/캐싱 패치입니다. 이 세션은 손대지 않고 그대로 두었습니다(추후 렉 진단 시 처리 예정):
- `lib/site-settings.ts` — `getSiteSettings` unstable_cache화 (+ 이 세션이 추가한
  storypress_title 기본값 1줄이 같은 파일에 얽혀 있어 함께 미커밋 상태).
- `app/(public)/blog/page.tsx`, `blog/category/[slug]/page.tsx`, `blog/tag/[tag]/page.tsx`
  — 읽기 쿼리 unstable_cache 래핑 / tag 페이지 force-dynamic→ISR.
- `app/api/revalidate/route.ts` — revalidateTag('blogs'/'settings'/'magazines') 추가.
- `next.config.mjs` — 삭제 포스트 404 리다이렉트(SEO).

## 3. 잘못 건드린 것 있는가?
- app.mhj.nz 쪽: **없음** (접근 자체 안 함).
- 홈페이지 쪽: 스코프 이탈 없음. storypress_title DB 쓰기는 원 지시서의 기결재①에 따른 것.
- 유일한 유의점: `git push origin main`이 브랜치 전체를 보내며, 로컬 main에 이미
  있던(푸시만 안 된) 기존 커밋 3개(fact-verify 스킬, korean-lyrics 문서 2건 — 전부
  문서/스킬 파일, 앱 코드 아님)가 함께 origin에 올라감. 배포 동작엔 영향 없음.

## 4. 조율이 필요할 수 있는 지점
- **가격**: 랜딩에서 금액 숫자를 전부 제거하고 "앱 내 표시"로 위임했습니다. 앱 쪽
  `config/pricing.ts`(NZD 기준 4통화)가 단일 진실 소스로 유지되는지 확인 바랍니다.
- **H1 전파**: 현재 배포된 홈페이지 코드의 `getSiteSettings`는 (미커밋 캐싱 패치가
  빠진) 평문 버전이라 /storypress(force-dynamic)가 매 요청 DB를 조회 → H1 즉시 반영.
  추후 캐싱 패치를 배포하면 `revalidateTag('settings')`로 무효화되도록 이미 배선돼 있음.
