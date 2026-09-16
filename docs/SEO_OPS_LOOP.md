# 검색 노출 운영 루프 (2026-09-17 ~)

> 마스터 플랜 `docs/PLAN-search-visibility-2026-09.md` 의 코드 웨이브(W1~W6)는 2026-09-13 에 전부 머지됐다.
> 이 문서는 그 다음 — **매주 같은 순서로 돌리는 운영 루프**다. 코드가 아니라 콘텐츠·콘솔·측정이 남았다.
> 상태 표기와 결정 게이트는 마스터 플랜을 따르고, 여기서는 "이번 주 무엇을 하나"만 말한다.

---

## 0. 지금 어디에 있나 — 2026-09-17 실측

**깔린 것(라이브 확인)**

| 신호 | 상태 |
|---|---|
| `<html lang>` | `en-NZ` |
| 엔티티 그래프 | 글 페이지에 `#organization` · `about#yussi` · `about#penny` `@id` 참조 |
| `/llms-full.txt` | 200 · 84KB(상위 20편 전문) |
| IndexNow 키 파일 | 200 |
| sitemap | 139 URL |
| 함수 리전 | syd1(DB 옆) — 검색 중앙값 0.21초 |
| 주간 감사 | 13종, 일요일 18:00 UTC(월 06:00 NZ) |
| 발행 게이트 | 필수 4항목 저장 차단 + HARD 결함 확인창(PR #78) · D3 차단 모드 전환은 **2026-10-08** |

**흐르는 것(`docs/measurements/traffic-2026-09-17.md`)**

| 지표 | 값 | 읽는 법 |
|---|---|---|
| 주간 유기 세션 | 4 → 0 → 1 (8/31 · 9/7 · 9/14 주) | 목표 60 의 **2%**. direct 53 은 QA 세션이지 독자가 아니다 |
| 네이버 유기 세션 | **0**(3주 내내) | 미등록이거나 색인 전. 콘솔 확인 없이는 구분 불가 |
| Bing | 주 0~2 | IndexNow 는 정상. 등록·색인 수는 콘솔에서만 보인다 |
| 구독자 | 15(변동 없음) | |
| 주제 SERP(구글, 미국 로케일) | `mid-year report NZ` **5위 등장**(09-07 부재 → 09-17 5위) · `starting school NZ Korean family` 부재 · `Year 7 intermediate NZ` 부재 · `site:` 2 URL | 구조 패치 뒤 **처음으로 주제 쿼리에 잡혔다**. 나머지는 아직 |
| 운영 컬럼 채움 | seo_title 0/81 · summary_ko 0/81 · FAQ 0/81 · 내부링크 2개+ 7/81 | **여기가 병목이다** |

**한 줄 진단**: 파이프는 다 깔렸는데 물이 안 흐른다. 물은 두 군데서 온다 — (a) 콘솔 등록·색인(사용자 로그인 작업, 코드 0), (b) 81편의 빈 칸(편집 작업). 둘 다 Claude 가 대신 못 하고, 둘 다 없으면 8주 목표는 안 온다.

---

## 1. 역할 — 누가 무엇을

| | 두 분(편집·계정) | Claude(도구) |
|---|---|---|
| 콘텐츠 | 새 글 본문 · 보강 본문 · AI 초안(seo_title·summary_ko) **승인** · FAQ 문답 · 내부 링크 **삽입 결정** | 정비 큐 · 처방 목록 · 링크 후보 · AI 초안 · fact-verify · 실명 검사 |
| 콘솔 | 네이버 서치어드바이저 · Bing Webmaster · GSC · GA4 (로그인 필요) | 절차서 · 결과 해석 · verification 코드 교체 |
| 측정 | 콘솔 숫자 3개를 주 1회 옮겨 적기 | 유입 스냅샷 · 감사 · 기준선 · SERP 프로브 |
| 코드 | — | 감사·폼·렌더 회귀, 새 결함 유형의 게이트 편입 |

원칙(마스터 플랜 §7 재확인): 본문은 자동 수정하지 않는다 · AI 요약은 승인 없이 게시하지 않는다 · 감사를 느슨하게 하지 않는다 · 기준선(`--update-baseline`)은 **정비 뒤에만** 잠근다.

---

## 2. 주간 루프

| 언제 | 누가 | 무엇 | 어떻게 |
|---|---|---|---|
| **월 오전** | Claude | ① 주간 감사 결과 확인 | `gh issue list -l site-audit`. 실패 이슈가 있으면 그 대화부터(1대화 = 1이슈) |
| | Claude | ② 유입 스냅샷 · 정비 큐 재생성 | `node --env-file=.env.local scripts/report-traffic-snapshot.mjs --write` → `node --env-file=.env.local scripts/report-refit-queue.mjs --write` |
| | 두 분 + Claude | ③ 이번 주 보강 2편 선정 | 큐 상위 중 **스냅샷 "유기 유입이 도착한 글"과 겹치는 것부터**(이미 검색이 찾은 글의 결함이 가장 비싸다). 없으면 큐 순서대로 |
| **화~목** | 두 분 | ④ 새 글 1편 | `docs/CONTENT_TEMPLATE.md` 순서대로. 폼 체크리스트 빨강 0 · 확인창 없이 발행되면 감사도 초록이다 |
| | 두 분 | ⑤ 보강 2편 | 아래 **보강 절차** |
| | Claude | ⑥ 발행·보강 직후 | `audit-seo-regression.mjs`(결함 수 확인) → 정비로 줄었으면 `--update-baseline` → `llms-txt-generator` 스킬로 llms-full 반영 확인 → 캐시 무효화는 폼이 한다 |
| **금** | 두 분 | ⑦ 콘솔 3분 | 네이버 "사이트맵 가져온 URL 수·수집 현황" · Bing "색인된 페이지" · GSC "노출·클릭(7일)" — 숫자 3개를 그 주 `docs/measurements/traffic-*.md` 맨 아래에 한 줄 |
| | Claude | ⑧ 새 글 색인 요청 | 네이버 "웹페이지 수집" 은 두 분이 URL 을 넣는다(로그인). IndexNow 는 발행 시 자동 |

**보강 절차(글 1편, 20~30분)** — `/mhj-desk` 글 편집 화면에서

1. `seo_title` — AI 초안 버튼 → 30~60자로 다듬어 승인. **지면 제목은 건드리지 않는다**
2. 한국어 요약 — AI 초안 → 두 분 목소리로 고쳐 승인(2~3문단). 어색하면 비워 둔다 — 빈 칸이 어색한 요약보다 낫다
3. FAQ 2~3개 — 독자가 실제로 물을 문장으로. 답은 본문에 있는 것만
4. 내부 링크 2개(허브 1개) — **관련 글·내부 링크 패널**의 후보에서 고르고 "링크 복사" 로 본문의 **기존 문구**에 건다. 문장을 새로 쓰지 않는다
5. 처방 목록의 나머지(H2 · Key takeaways · alt · 지역 신호 · 대표 사진)는 큐 문서의 체크박스대로
6. 저장 → 확인창이 뜨면 항목을 읽고 처리(취소가 아니라 채우기)

허브 = `starting-school-in-new-zealand`(클러스터 A) · 카테고리 페이지 7개 · 향후 "NZ school years explained" (신규 후보).

---

## 3. 월간 (매달 첫 월요일)

- 스냅샷 4주 비교 — 주간 organic 합의 추세 한 줄. 늘지 않으면 §5 의 "병목 순서" 를 다시 본다
- 정비 큐 상위 20 재생성 → 지난달 보강한 글이 큐에서 빠졌는지 확인(빠지지 않았으면 처방이 덜 됐거나 판정이 틀린 것 — 후자면 `lib/seo-defects.mjs` 테스트부터)
- SERP 프로브 4쿼리(§0 표의 4개) 재실행 — 존재/부재만 기록
- **2026-10-08**: D3 차단 모드 전환 판단. 확인창 4주 동안 "취소" 없이 발행된 새 글의 HARD 결함이 0이면 전환, 아니면 4주 연장
- **2026-11-03**: 한국어 요약 실험 판단 — 네이버 색인·유입이 0 이면 요약 블록은 유지하되 네이버 배포는 접는다(마스터 플랜 §1.2)

---

## 4. 체크포인트

| 시점 | 무엇 | 어디에 |
|---|---|---|
| **2026-10-06 (+4주)** | 색인 URL(G/B/N) · 주간 유기 세션 · 구독자 · seo_title/summary_ko/FAQ 채움 수 · 결함 기준선 | `docs/measurements/checkpoint-2026-10-06.md` |
| **2026-11-03 (+8주)** | 마스터 플랜 §0 목표표 전부 + AI 프로브 20문항(Q7) 재실행 | `docs/measurements/checkpoint-2026-11-03.md` |

+4주 표는 스냅샷 스크립트 출력 + 콘솔 숫자 3개 + `report-refit-queue` 의 "전체 현황" 표를 그대로 붙이면 된다.

---

## 5. 지금 당장 — 이번 주(9/17~9/21) 할 일

병목 순서대로. 위가 안 되면 아래는 효과가 없다.

| # | 누가 | 일 | 왜 지금 |
|---|---|---|---|
| 1 | 두 분 | **콘솔 등록 상태 확인** — 네이버 서치어드바이저에 `https://www.mhj.nz` 가 등록돼 있는가, 사이트맵 "가져온 URL 수" 는 몇인가 · Bing Webmaster 등록 여부 · GSC 는 두 verification 토큰 중 어느 속성이 살아 있는가 | 3주간 네이버 세션 0. 등록이 안 됐으면 나머지 전부가 헛돈다. 절차는 `docs/naver-quickstart-10min.md` · 요청 항목은 `docs/self-diagnosis/2026-09-07-report/07-questions-for-user.md` Q1~Q3 |
| 2 | 두 분 | **#77 ORPHAN 결정** — 글 119 의 기존 문구에 링크만 걸기: (1) "children's performances in New Zealand" → `/blog/starting-school-in-new-zealand` (2) "Year 5 and 6 students at school" → `/blog/year-7-intermediate-school-nz-curriculum`. 1개면 게이트 초록, 2개면 preflight 목표 충족 | 이걸 닫아야 주간 감사가 초록이 되고 기준선을 잠근다. 결정만 주면 Claude 가 반영·기준선·이슈 닫기 |
| 3 | 두 분 | **보강 3편** — 큐 1·2·3번: `fearless-four`(조회 205) · `100-days-of-schhol`(오타 `seo_title` 로 우회) · `the-word-cards` | 읽히는 글부터. seo_title·summary_ko·FAQ 가 **처음으로 0 → 3** 이 되면 Rich Results Test 와 llms-full 한국어 요약이 실제 값으로 검증된다 |
| 4 | 두 분 | **AI 프로브 before** — Q7 의 5문항 × ChatGPT·Claude·Gemini·Perplexity, 웹 검색 켜고, 인용 유무만 20칸 | 아직 before 값이 없다. 11/03 재실행 때 비교할 기준이 지금뿐이다 |
| 5 | 두 분 | 관리자 설정 `storypress_cta_text`("Join the Waitlist" → 앱은 열려 있음) · GA4 맞춤 측정기준 5개(pillar·direction·position·location·link_url) | W6-C 잔여. 5분 |
| 6 | Claude | 위 결정이 오면: #77 반영 → `--update-baseline` → 이슈 닫기 · 보강 3편 뒤 Rich Results Test · 스냅샷 | |

---

## 6. 함정 (이 루프에서 실제로 걸릴 것)

- **direct 세션을 독자로 읽지 않는다.** 09-05·09-07·09-11 의 스파이크는 QA 다. 추세는 organic 열만 본다
- **폼 임계값 ≠ 감사 임계값.** 폼(`lib/blog-preflight.mjs`)은 목표치(내부링크 2·H2 3), 감사(`lib/seo-defects.mjs`)는 결함선(내부링크 0=ORPHAN). 수치를 말할 때 어느 쪽인지 밝힌다
- **기준선을 먼저 잠그면 결함이 사라진 것처럼 보인다.** `--update-baseline` 은 정비 뒤에만
- **한국어 요약을 채우려고 억지로 쓰지 않는다.** 요약 블록은 `lang="ko"` 신호이자 네이버 배포 원고다 — 목소리가 아니면 비워 둔다
- **`site:` 검색 결과로 색인 수를 세지 않는다.** 구글·Bing 모두 `site:` 가 엉뚱한 결과를 섞는다(09-07·09-17 재확인). 색인 수는 콘솔 숫자만
- **실명 P0.** 요약·FAQ·seo_title 에도 Min/Hyun/Jin 표기만. AI 초안은 라우트가 `lib/name-guard.mjs` 로 거르지만 손으로 쓴 것은 폼 훅이 못 본다 — 저장 전 눈으로

---

## 7. 관련 문서

- 계획·결정·완료 기록: `docs/PLAN-search-visibility-2026-09.md`
- 무엇을 먼저 고칠지: `docs/W5-refit-queue.md` (월요일마다 재생성)
- 새 글 뼈대: `docs/CONTENT_TEMPLATE.md`
- 유입 스냅샷: `docs/measurements/traffic-*.md` (`scripts/report-traffic-snapshot.mjs`)
- 콘솔 절차: `docs/naver-quickstart-10min.md` · `docs/naver-search-advisor-setup.md`
- 사용자 요청 항목 원문: `docs/self-diagnosis/2026-09-07-report/07-questions-for-user.md`
