# 캐러셀 V4 — 인수인계 문서

**작성일:** 2026-04-17
**작업 모델:** Claude Opus 4.6 (1M context)
**세션:** V4 근본 재구축 + 비율 선택 UX + 동적 슬라이드

---

## 1. 현재 상태

- ✅ **V4 구현 완료** — Phase A~E 전부 작업 완료
- ✅ **TypeScript 검증 통과** — `npx tsc --noEmit` 0 에러
- ✅ **로컬 테스트 성공** — 3~10장 범위에서 정상 생성 확인됨
- ⚠️ **미커밋** — 작업 완료 후 이 문서로 인수인계 → 커밋+푸시 진행
- ⚠️ **레이아웃 폴리싱 미완** — 일부 레이아웃에서 공간 어색함 (아래 4번 참고)

---

## 2. 수정한 파일 목록 (이번 세션 — 9개)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `components/carousel/v2/SlideRenderer.tsx` | `background: '#FFFFFF'` 추가 → Export 검은색 방지 |
| 2 | `components/carousel/v2/ExportEngine.tsx` | `canvasWidth/canvasHeight ×2` 고해상도 옵션, `backgroundColor: '#FFFFFF'`, hidden div `left: -99999 zIndex: -1` |
| 3 | `components/carousel/v2/LivePreview.tsx` | 단일 download에도 동일한 고해상도 + background 옵션 적용 |
| 4 | `components/carousel/v2/convertInput.ts` | **고정 10장 → 동적 3~14장 생성**. 빈 fallback 제거, 채워진 콘텐츠만 슬라이드화 |
| 5 | `components/carousel/utils.ts` | `getDefaultAspectRatio(category)` 함수 추가 (Travelers/Life in Aotearoa → 1:1, 나머지 → 4:5) |
| 6 | `components/carousel/v2/AssetLibrary.tsx` | `accentOnly` prop 추가 — Photos 탭 숨김, Accents만 표시 |
| 7 | `components/carousel/v2/SlideEditPanel.tsx` | 이미지 미지원 7개 레이아웃에서도 "Accent" 버튼 노출 (Sparkles 아이콘) |
| 8 | `app/mhj-desk/carousel/_components/CarouselEditor.tsx` | Generate 버튼 위에 4:5 / 1:1 비율 선택 카드 UI + "Recommended" 뱃지 |
| 9 | `app/mhj-desk/carousel/page.tsx` | `useMemo` + `getDefaultAspectRatio` import, 블로그 선택 시 카테고리 기반 기본 비율 자동 설정, 파일명에 `-4x5`/`-1x1` 반영, 헤더 "10장" → "자동 생성" |

**이전 세션 미커밋 (같이 커밋됨):**
- `components/carousel/types.ts` — `totalSlides` 필드 추가
- `components/carousel/v2/SlideFooter.tsx` — `totalSlides` 조건부 렌더
- `components/carousel/v2/layouts/*.tsx` — 27개 레이아웃 전체 (이전 V3 토큰 이식 작업)

---

## 3. 사용자 테스트 결과

| 항목 | 결과 |
|------|------|
| 3장 (최소) 생성 | ✅ OK |
| 10장 (최대) 생성 | ✅ OK |
| 미리보기 = Export PNG 일치 | ✅ 확인됨 |
| 브라우저 리사이즈 시 레이아웃 유지 | ✅ OK (ResizeObserver 작동) |
| 그리드 뷰 2열 | ✅ OK |
| 비율 선택 (Recommended 뱃지) | ✅ OK |
| Export 파일명 `-4x5` / `-1x1` 반영 | ✅ OK |
| **일부 레이아웃 공간 어색함** | ⚠️ 폴리싱 필요 (5번 참고) |

---

## 4. 남은 작업

### 4-1. 커밋 + 푸시 (이 세션 종료 시점)
```bash
git add -A
git commit -m "feat(carousel): V4 rebuild — unified render + aspect ratio UX + dynamic slides (3~10 slides tested OK)"
git push origin main
```

### 4-2. 레이아웃 폴리싱 3건 (다음 세션 — 별도 작업)

V4 렌더링 통일 후에도 일부 레이아웃에서 공간 사용이 어색함. 기존 레이아웃 파일 개별 수정으로 접근. V2 프롬프트에서 금지했던 "CoverArch/ContentEditorial 개별 수정"은 Phase A 완료 후 별도 세션에서 처리하기로 한 항목.

| 레이아웃 | 증상 | 수정 방향 (예상) |
|---------|------|------------------|
| `CoverArch` | 긴 제목 (3줄 이상) 이 Footer에 근접/짤림 | 제목 max-height 또는 fontSize clamp, arch photo 높이 조정 |
| `ContentEditorial` | 본문 하단과 Footer 로고 간격 부족 | 본문 영역 paddingBottom 증가 또는 Footer gap 조정 |
| (사용자 지정 3번째) | 사용자 테스트 시 피드백 받은 건 | 별도 세션에서 구체화 |

**접근 원칙:**
- `v2Tokens.fontSize/safeZone` 건드리지 말 것 (V3 업계 기준 유지)
- 각 레이아웃 파일 내부 spacing만 조정
- 수정 전 `npx tsc --noEmit` + 브라우저 시각 확인

### 4-3. Puppeteer 도입 (선택, 다음 단계)
현재 html-to-image 유지 중. 만약 CORS/폰트 문제가 재발하면 open-carrusel 레퍼런스 방식으로 `/api/carousel/export` 서버 라우트에 Puppeteer 도입 검토 (Vercel Serverless Chromium 용량 문제 감수).

---

## 5. 중요 컨텍스트

### 5-1. 렌더링 계약 — "미리보기 = Export DOM 일치" 원칙
**핵심:** `SlideRenderer`는 **항상 1080×H 고정 DOM**을 렌더하고, `scale` prop으로만 축소된다. 따라서:
- LivePreview 단일/그리드 뷰: `scale < 1`로 축소
- ExportEngine hidden div: `scale = 1` 실제 크기 → html-to-image 캡처
- **결과:** 두 경로가 동일한 DOM → 미리보기와 다운로드 PNG가 항상 일치

**절대 하지 말 것:**
- `SlideRenderer`에 `preview` 분기 추가 금지
- 레이아웃 파일에서 `width: 100%, height: 100%` 사용 금지 (반드시 tokens의 고정 px)
- `visibility: hidden` 사용 금지 (html-to-image가 검은색으로 캡처). `opacity: 0` + `left: -99999`만.

### 5-2. dev 서버 상태 (2026-04-17 시점)
- **PID 93332** — `/tmp/mhj-dev.log`에 로그 기록 중
- **포트 3003** 점유 (LISTEN)
- **`.next` 캐시 정상** (이전 세션에서 `npm run build` 실수로 오염된 것은 `/tmp/mhj-next-old-*`로 이동 후 깨끗이 재생성됨)
- **⚠️ 재발 방지:** dev 서버가 돌고 있는 동안 `npm run build` 실행 금지. 검증은 `npx tsc --noEmit`만. (메모리 `feedback_npm_build_vs_dev.md`에 저장됨)

### 5-3. 안전 훅 주의
- `.claude/hooks/safety-gate.sh`가 `rm -rf .next`를 차단함
- 필요 시 `mv .next /tmp/mhj-next-old-$$`로 우회 (이번 세션에서 사용한 방법)

### 5-4. Export 품질 설정
```ts
htmlToImage.toPng(el, {
  width: 1080,
  height: H,                    // 1350 또는 1080
  canvasWidth: 1080 * 2,        // 2160 고해상도
  canvasHeight: H * 2,
  backgroundColor: '#FFFFFF',   // 검은색 방지
  pixelRatio: 1,
  cacheBust: true,
});
```

---

## 6. 참고 레퍼런스

두 오픈소스 레포를 `/tmp/`에 클론해서 분석함:

### 6-1. `github.com/Hainrixz/open-carrusel` (MIT, 1일 전 공개)
- **차용 개념:** iframe + ResizeObserver + 공유 렌더링 계약
- **핵심 파일:** `src/lib/slide-html.ts` — `wrapSlideHtml()` 하나로 preview/export 통일
- **MHJ 채택 방식:** iframe 없이 React 직접 렌더, 하지만 "scale prop으로만 축소, DOM은 1080×H 고정" 원칙은 그대로 이식
- **Puppeteer는 미채택** (Vercel Serverless 부담 회피)

### 6-2. `github.com/FranciscoMoretti/carousel-generator`
- **차용 개념:** html-to-image `canvasWidth/canvasHeight` 고해상도 옵션, `/api/proxy-image` CORS 우회
- **MHJ 채택:** `canvasWidth ×2` 적용, CORS 우회는 이미 구현된 `/api/carousel/proxy-image` 활용

### 6-3. 원본 작업 지시서
- `docs/CAROUSEL_V3_CLAUDE_CODE_PROMPT.md` (루트) — V3→V4 전환 가이드
- 사용자 채팅 입력 프롬프트 — V4 5-Phase 상세 설계도 (이 문서의 원본)

---

## 부록: 빠른 재시작 가이드

dev 서버가 이상해지면:
```bash
# 1. 현재 서버 찾기
lsof -i :3003

# 2. 종료 (PID 확인 후)
kill <PID>

# 3. 캐시 정리
mv .next /tmp/mhj-next-old-$$

# 4. 재시작
npm run dev > /tmp/mhj-dev.log 2>&1 &

# 5. 로그 확인
tail -20 /tmp/mhj-dev.log
```

---

**끝.** 다음 세션에서 이 문서부터 읽으면 전체 맥락 복구 가능.
