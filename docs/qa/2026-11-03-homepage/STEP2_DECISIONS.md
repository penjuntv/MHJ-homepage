# STEP 2 — 사람 확인과 결정 (2026-11-03)

> 지시서 §3 STEP 2(관문). 이 관문을 통과하기 전에는 M1 코드를 쓰지 않는다.

## 1. 5초 테스트 응답 수

- 대상: https://claude.ai/artifact/9VzcuqfMSaiJNpSF4JXZJB
- 조회: `ArtifactData list responses`(소유자 권한, limit 1000) → **0건** (2026-11-03)
- 응답이 0건이라 지시서대로 테스트 이미지를 M0 이후 화면으로 바꿨다(PeNnY 승인: 아래 2절 Q0).
  - 바꾸기 전 발행본 이미지 4장의 sha256 이 `docs/qa/2026-11-03-self-check/five-second-test/img/*` 와 같음을 확인한 뒤 덮어썼다(남이 바꾼 이미지가 아님).
  - A = STEP 1 기준선 `home-1280-light.png`·`home-390-light.png`
  - B = 같은 기준선 화면에 `mockup-B.css`·`mockup-B.js` 를 주입해 찍은 것(`qa-screenshots/2026-11-03-homepage/base-mockB/`, 실명 0건)
  - 새 이미지 원본: `five-second-test/img/` (이 폴더). 페이지 HTML 은 바꾸지 않았다(`self-check/five-second-test/index.html` 그대로).
  - Artifact 버전 2(version id `1793682211-e0d8`). 응답 저장 규칙(`responses` 읽기·쓰기 interact)은 그대로 이어졌다.
- **페이지는 지금 비공개(소유자만 열림)다.** 응답자가 열려면 PeNnY 가 페이지의 Share 메뉴에서 링크 공유를 켜야 한다.

## 2. 결정 (AskUserQuestion 답 그대로)

| 항목 | 질문 | PeNnY 답(원문) | 추천과 같은가 |
|---|---|---|---|
| Q0 테스트 | 응답 0건, 이미지가 M0 이전 화면 — 어떻게? | "이미지 교체 후 응답 대기 (Recommended)" | 같음 |
| D1 시안 | 홈 디자인 방향 | "B 시안 (Recommended)" | 같음 |
| D2 다크 강조색 | 링크·누를 곳 | "#8FB39B 그린 (Recommended)" | 같음 |
| D3 규칙서 | DESIGN_RULES 개정 | "개정 (Recommended)" | 같음 |
| D4 본문 서체 | (1차) 본문 서체는? | "우리 본문 모두 영어인데 한글 폰트보다 영어최적화 폰트 써야하지" | **다름** → 재검토 |
| D4 본문 서체 | (2차) 비교판 보고 고르기 | "기사 본문만 Literata (Recommended)" | 재검토 뒤 추천 |
| D5 다크 바탕 | `#0A0A0A` | "유지 (Recommended)" | 같음 |
| D6 기사 제목 이탤릭 | Playfair 900 이탤릭 | "유지 (Recommended)" | 같음 |
| D7 원문 대문자 꼬리표 | FROM OUR GALLERY 등 | "삭제 (Recommended)" | 같음 |

### D4 재검토 근거

- 라이브 화면 글자 실측: 홈 한글 0·라틴 2,699 / 블로그 상세 한글 341·라틴 8,162(한글은 "한국어 요약" 상자뿐, 약 4%) / 매거진 목록 한글 0. PeNnY 말대로 본문은 거의 영어다.
- 참고: Noto Sans KR 의 라틴 글자는 Adobe Source Sans 계열 디자인이다. 그래서 "영어용 산세리프로 바꾸기"(Public Sans 등)는 눈에 띄는 차이가 작다. 차이가 큰 쪽은 **영어 읽기용 세리프**다.
- 비교판: `fonts-en/sheet-body-{1280,390}.png`, `sheet-ko-{1280,390}.png`(같은 기사·같은 문단, 영어 글꼴 앞 + Noto Sans KR 뒤라 한글 요약은 Noto 로 그려짐. CDP 로 확인).

| 후보 | 추가 글꼴 전송 | 비고 |
|---|---:|---|
| 지금 Noto Sans KR | 0KB | |
| Source Serif 4 | 119KB | 고전적 잡지 본문 |
| Newsreader | 129KB | 같은 크기에서 글자가 작아 보여 390 폭에서 덜 또렷함(눈 판단) |
| **Literata (선택)** | **84KB** | 전자책 본문용, 390 폭에서 가장 또렷함(눈 판단) |
| Public Sans | 26KB | 영어 산세리프, 지금과 차이 작음. 사이트 전체 적용은 37파일 114곳이라 별도 작업 |

- **적용 범위(결정): 기사 본문만.** 기사 본문·요약 문단에 `'Literata', 'Noto Sans KR', serif`. 메뉴·라벨·소제목·카드는 지금 산세리프(Noto) 그대로다. 제목은 Playfair 그대로다(D6).
- 반영 단계: **M2(기사 읽기 화면)**. `app/layout.tsx` 의 Google Fonts `<link>` 에 Literata(opsz, 400·600 + 이탤릭 필요 여부 확인)를 더하고, `globals.css` 의 `.blog-content` 계열에 스택을 건다. M2 수정 파일이 4 → 5개가 된다(상한 5 이내).

## 3. M1 착수 조건 판정

- 조건: D1 = B **그리고** 응답 3건 이상에서 B 의 Q1 적중이 A 보다 낮지 않을 것.
- 지금: D1 = B ✅ · 응답 **0건** ❌ → **M1 착수 보류(응답 대기)**. PeNnY 는 테스트를 건너뛰지 않고 응답을 기다리기로 했다(Q0).
- 응답이 3건 이상 모이면 집계한다. 집계 항목: Q1 "무엇을 하는 곳" 적중(가족·기록 + 뉴질랜드·오클랜드), Q2 "한국인 가족" 적중, Q4 어느 쪽이 더 믿음이 가는가. 숫자를 부풀리거나 해석으로 메우지 않는다.
