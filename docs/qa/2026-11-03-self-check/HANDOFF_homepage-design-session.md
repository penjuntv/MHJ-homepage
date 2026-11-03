# MHJ 홈페이지 디자인 전담 세션 — 지시서 (2026-11-03)

> 받는 곳: **새 MHJ_HOMEPAGE 세션**(홈페이지 디자인 전담). 저장소 `~/MHJ_HOMEPAGE`, 라이브 www.mhj.nz
> 보낸 곳: MHJ 디자인 자가검증 세션(브랜치 `claude/design-self-check-d61c20`, 2026-11-03)
> 성격: 자가검증(STEP 0~5)은 끝났다. 이 세션의 일은 **기획안(M0~M3)을 라이브까지 실제로 반영하는 것**이다.
> 기획안: `docs/qa/2026-11-03-self-check/UPGRADE_PLAN.md` · 읽기용 페이지 https://claude.ai/artifact/7v3TxY6y5dHexDMGLrAzt3
> 이 지시서와 저장소 `CLAUDE.md` 가 충돌하면 **저장소 규칙을 따르고** 충돌을 보고한다.

---

## 0. 한 줄 목표

**가족 사진과 이야기는 그대로 두고, 그 위에 덧씌운 "기본값처럼 보이는 꾸밈" 세 가지를 홈 → 기사 → 매거진 순서로 걷어 낸다.** 세 가지는 Tailwind 인디고·보라, 자간 넓은 대문자 꼬리표, 가운뎃점 메타 문구다. 단계마다 PR 하나를 만들고, PeNnY 결재를 받아 머지한 뒤 라이브에서 확인한다.

## 1. 지금 상태 (2026-11-03 실측 — 시작할 때 다시 확인할 것)

| 항목 | 상태 |
|---|---|
| M0 웹폰트 회귀 | **[penjuntv/MHJ-homepage#179](https://github.com/penjuntv/MHJ-homepage/pull/179) 머지됨**(2026-11-03 00:35 UTC, main `960475b`). 라이브 홈 `<head>` 에 Noto Sans KR·Playfair Display `<link>` 가 있음을 curl 로 확인했다. **실제로 그려지는 글꼴(CDP) 검증은 아직 안 했다** → 이 세션 STEP 1 |
| 자가검증 자료 | 브랜치 `claude/design-self-check-d61c20` 에 **로컬 커밋 5개만** 있다(0a0dc9d·b79a6e7·c631d4e·da4de13·dee0811, push 0). main 에는 없다 → STEP 0 에서 가져온다 |
| 캡처 원본 | `/Users/penny/MHJ_HOMEPAGE/qa-screenshots/2026-11-03-self-check/{before,after-B,pairs}/`(gitignore 대상). **M0 이전 화면**이라 M1 비교 기준으로 쓰지 않는다 |
| 5초 테스트 | https://claude.ai/artifact/9VzcuqfMSaiJNpSF4JXZJB , **응답 0건**(11-03 기준). 쓰인 이미지는 M0 이전 화면이다 |
| PeNnY 결정 D1~D7 | 미결. 추천: D1 시안 B · D2 다크 강조 `#8FB39B` · D3 규칙서 개정 · D4 본문 Noto 유지 · D5 다크 바탕 `#0A0A0A` 유지 · D6 기사 제목 이탤릭 유지 · D7 원문 대문자 꼬리표 삭제 |
| 다른 세션 | [PR #179 머지 후 라이브 폰트 검증](#local_34f5b967-cd34-4b0e-a4a5-9529579aa580) 세션은 머지 승인을 기다리던 중 멈춰 있다. 이 세션이 M0 검증을 넘겨받으므로 그 세션은 쓰지 않는다(PeNnY 가 보관 처리) |

줄 번호(`globals.css:45` 등)는 11-03 기준이다. **각 단계를 시작할 때 grep 으로 다시 잡는다.** 문서나 기억에 있는 줄 번호로 바로 고치지 않는다.

## 2. 먼저 읽을 것 (이 순서로)

1. `CLAUDE.md`(저장소) — 특히 규칙 5(다크 = CSS 변수만, `--text-primary` 없음), 6(호버), 7(반경), 10(실명 P0), 11(Done 정의), 12(1대화 = 1기능, Plan Mode), 13(`/code-review`·`/verify`), 14(판단 스킬)
2. `docs/qa/2026-11-03-self-check/UPGRADE_PLAN.md` — 단계표·성공 기준·규칙서 개정 초안·바꾸지 않을 것
3. `docs/DESIGN_RULES.md` §5.2·§6.1·§6.2·§6.4·§10.1·§17.2, `docs/DESIGN_SYSTEM.md`(토큰)
4. `docs/qa/2026-11-03-self-check/STEP2_INVENTORY.md` — 바꿀 곳 전수표 438행(파일:줄·용도·제안 색·명암비)
5. `docs/qa/2026-11-03-self-check/STEP3_MOCKUP_B.md` + `mockup/mockup-B.css`·`mockup-B.js` — 시안 B 의 정확한 값(구현의 출발점)
6. `mhj-brand-kit/BRAND_GUIDE.md` 색 표

## 3. 작업 순서 (STEP 마다 멈추고 한국어로 보고)

### STEP 0 — 작업 공간과 자료 준비
1. main 기준 새 워크트리(브랜치 예: `claude/homepage-design-m1`)에서 시작한다. `git fetch origin` 후 `origin/main` 에 `960475b`(#179)가 들어 있는지 확인한다.
2. 자가검증 자료를 가져온다. 같은 `.git` 을 쓰므로 로컬 브랜치가 보인다:
   `git merge --no-ff claude/design-self-check-d61c20 -m "docs(qa): 디자인 자가검증 자료(2026-11-03) 반입"`
   → verify: `git diff --stat origin/main -- app components middleware.ts` = 0 (문서만 들어왔는지)
3. 이 문서 묶음은 **문서 전용 PR(PR-0)** 으로 먼저 올린다. 메모리 규칙 "문서 전용 PR 자동 머지"에 따라 CI 통과 후 머지해도 된다. 코드 PR(M1~M3)은 반드시 PeNnY 결재를 받는다.
4. 측정 스크립트(`docs/qa/2026-11-03-self-check/scripts/*.mjs`)는 라이브 URL 이 하드코딩돼 있다. **`BASE` 환경 변수를 받게 고친다**(기본값 `https://www.mhj.nz`). 로컬(`http://localhost:3003`)이나 Vercel 미리보기 주소로도 같은 측정을 하기 위해서다. 이 수정은 PR-0 에 함께 넣는다.
5. dev 서버가 이미 떠 있는지 확인한다(`lsof -i :3003`). 떠 있으면 `npm run build` 를 하지 않는다(규칙 11).

### STEP 1 — M0 라이브 검증과 새 기준선
M0 가 배포됐으니 **글꼴이 바뀐 진짜 현재 화면**을 새 기준선으로 삼는다.
1. 라이브 홈·블로그 상세(`/blog/starting-school-in-new-zealand`)·`/magazine` × 1280·1194·390 에서 측정한다.
   - `fonts.gstatic.com` 응답이 생기는지
   - CDP `CSS.getPlatformFontsForNode` 로 본문이 `Noto Sans KR`(isCustomFont:true), 기사 제목이 `Playfair Display`(isCustomFont:true)로 그려지는지
   - 측정은 `scripts/fonts.mjs` 방식을 그대로 쓴다.
2. 실패하면(웹폰트가 안 그려지면) M1 로 넘어가지 않는다. `diagnosing-bugs` 로 원인을 잡고 보고한다.
3. 새 기준선 캡처 18장 → `qa-screenshots/2026-11-xx-homepage/base/`(`scripts/capture.mjs`). 로그아웃 상태여야 하고, 실명 검사가 0이어야 한다.
4. 새 기준선 숫자(라이브 URL, 각 1회):
   - `npx impeccable@4.8.0 detect <url> --json` → `docs/qa/2026-11-xx-homepage/impeccable-{home,blog}-base.json`
   - `scripts/dom-facts.mjs` → `dom-facts-base.json`
   - 11-03 수치(홈 43·블로그 40)와 나란히 표로 만든다. 차이는 글꼴 변화 몫이다.
- → verify: 본문·제목 웹폰트 렌더 증거(JSON), 18장, 건수표의 건수 = JSON 건수.

### STEP 2 — 사람 확인과 결정 받기 (관문 — 통과 전 M1 코드 금지)
1. **5초 테스트 응답 수를 센다.** ArtifactData `list` `responses`, artifact `https://claude.ai/artifact/9VzcuqfMSaiJNpSF4JXZJB`.
2. **응답이 0건이면** 테스트 이미지를 M0 이후 화면으로 바꿔 다시 발행하라고 PeNnY 에게 권한다. 지금 이미지는 방문자가 실제로 보지 못한 글꼴 상태다. 바꾸는 이미지는 다음 두 가지다.
   - A = STEP 1 기준선 `home-{1280,390}-light.png`
   - B = 같은 기준선에 `mockup-B.css`·`mockup-B.js` 를 주입해 찍은 것
   응답이 1건이라도 있으면 이미지를 바꾸지 않는다(응답끼리 비교할 수 없게 되기 때문).
3. 응답이 모이면 그대로 집계해 보고한다. 집계 항목:
   - Q1 "무엇을 하는 곳" 적중(가족·기록 + 뉴질랜드·오클랜드)
   - Q2 "한국인 가족" 적중
   - Q4 어느 쪽이 더 믿음이 가는가
   응답 수를 부풀리거나 해석으로 메우지 않는다.
4. D1~D7 을 PeNnY 에게 묻는다(AskUserQuestion, 추천을 첫 선택지로).
   **M1 착수 조건**: D1=B 이고, 응답 3건 이상에서 B 의 Q1 적중이 A 보다 낮지 않을 것.
   PeNnY 가 테스트를 건너뛰겠다고 직접 말하면 그 말을 그대로 기록하고 진행한다.
   D1=A 이면 M1~M3 대신 "A 유지 + 결함만 수정"으로 바꿔 범위를 다시 묻는다. 결함 수정 대상은 10px 라벨, 한 줄 길이, `.ai-reflection` 32px, AI Insight 보라 그라데이션이다.
- → verify: 응답 수(숫자 그대로), D1~D7 답과 그 답을 준 메시지 인용.

### STEP 3 — M1 홈 히어로·메타 (PR-1)
Plan Mode 로 들어가 수정 계획을 승인받은 뒤 구현한다(규칙 12). 수정 파일은 5개 이하다.

| 순서 | 파일 | 바꿀 것 |
|---|---|---|
| 1 | `docs/DESIGN_RULES.md` (+ D2 승인 시 `mhj-brand-kit/BRAND_GUIDE.md` 한 줄) | 기획안 "규칙서 개정 초안" 그대로. §6.4·§6.1·§6.2·§5.2·§10.1 개정, 새 항목 2개(가운뎃점 금지·제목 위 꼬리표 금지), 변경 이력. **규칙서를 첫 커밋으로** 넣어 다음 세션이 되돌리지 않게 한다 |
| 2 | `app/globals.css` | `--accent` 라이트 → `#3E5F4A`, 다크 → `#8FB39B`(D2). `--callout-bg` 두 곳. `.home-pillars-label`·`.pillar-empty` 대문자 해제 |
| 3 | `app/(public)/page.tsx` | h1 을 문장형 제목으로(24px 이상, `--text` 색). 메타 가운뎃점 → 쉼표. 대문자 라벨 정리 |
| 4 | `components/InstagramFeed.tsx` | "FROM OUR GALLERY" 꼬리표 삭제(D7), 태그 10px → 12px |
| 5 | `components/NewsletterCTA.tsx` | 안내문 11px → 13px, "Mairangi Notes" 라벨 대문자 해제 |

- **토큰 교체의 파급을 먼저 본다**: `var(--accent)` 를 쓰는 모든 공개 화면이 같이 초록으로 바뀐다(STEP2 전수표 "토큰으로 따라옴" 행). 관리자(`app/mhj-desk/**`)는 `var(--accent)` 를 0회 써서 번지지 않는다. 시작 전에 grep 으로 다시 확인한다.
- **h1 문구는 PeNnY 에게 확인받는다.** 시안 B 문구를 출발점으로 한다. 실명은 금지이고 사이트 표기(Min/Hyun/Jin·Yussi·PeNnY)만 쓴다.
- **검증**(로컬 `next dev --turbopack -p 3003` 또는 Vercel 미리보기, `BASE` 로 지정):
  - 홈 DOM: 인디고 0, 보이는 가운뎃점 0, 대문자 변환 요소 0, h1 24px 이상·`--text`
  - Impeccable 홈(미리보기 URL 1회): `kicker-above-heading` 0, `tiny-text` 0, `undersized-ui-text` 10 이하
  - `node scripts/qa/audit-contrast.mjs`·`audit-a11y.mjs` 0
  - 홈 1280·1194·390 × 라이트·다크 전후 12장 + 짝 비교(`scripts/pairs.py`, `-I` 없이 실행)
  - `npx tsc --noEmit` 0, `npm run build` 통과(dev 서버를 끈 뒤)
  - lint 는 워크트리 함정 때문에 `npx eslint --no-eslintrc -c .eslintrc.json <바꾼 파일>`
  - `/code-review` → `/verify` 를 명시적으로 실행
- PR 본문: 전후 숫자표 + 짝 비교 이미지 + 바꾸지 않은 것. **머지는 PeNnY 결재 후.**
- 머지·배포 뒤 라이브에서 할 일:
  - `scripts/qa/live-functional-check.mjs`
  - 홈 DOM 재측정
  - 라이브 3폭 캡처
  - 이것까지 끝나야 "끝"이다(메모리 "세계 수준 기준 + 라이브 검증 의무").

### STEP 4 — M2 기사 읽기 화면 (PR-2)
M1 이 라이브에서 확인된 뒤 시작한다. 진행 방식은 STEP 3 과 같다.

| 파일 | 바꿀 것 |
|---|---|
| `components/AiInsight.tsx` | 인디고·보라·그라데이션 → 그린 단색 면(라이트 `#EEF3EF` / 다크 `#18201B`, 토큰으로). 버튼 대문자 해제 |
| `app/(public)/blog/[slug]/page.tsx` | h1 대문자 해제(같은 Playfair 900). 메타 3px 점 → gap. "Continue Reading" 꼬리표 삭제(D7) |
| `app/globals.css` | `.blog-content` 한 줄 65~75자(약 600px·17px — **시안 2개를 찍어 PeNnY 확인 후** 확정). `.blog-faq h2` 대문자·자간 해제(목업에서 빠졌던 몫). `.dark .ai-insight-card`·`.comment-toast`. **`.ai-reflection` 반경 32px → 12px**(규칙 7 위반 해소). `.adjacent-card-label` 10px → 12px |
| `app/(public)/blog/[slug]/CommentSection.tsx` | "Join the conversation" 꼬리표 삭제(D7). 폼 라벨 10px → 13px |

- 성공 기준:
  - Impeccable 블로그 1회: `line-length` 0, `kicker-above-heading` 0, `wide-tracking`·`tiny-text` 0, `undersized-ui-text` 4 이하
  - DOM: 인디고·보라 0
  - 다크에서 AI 버튼이 테마 면을 따른다
  - 블로그 3폭 × 2테마 전후 12장
  - `audit-contrast`·`audit-a11y` 0
  - build·tsc 0
- **블로그 상세 1편만이 아니라** 일기형 글 1편·FAQ 있는 글 1편도 캡처해 본문 폭 변화가 깨지지 않는지 본다.
- **글 본문 HTML 속 명암 2.4:1**(`#9ca3af` 안내 상자 2건)은 DB 의 글 본문 `style=` 에 있다. 이번 PR 범위가 아니다. 고칠 SQL 초안만 쓰고 별도 결재로 올린다(`''` 이스케이프 규칙 8). 발행 글을 수정하면 revalidate 도 한다.

### STEP 5 — M3 매거진·목록 (PR-3)
| 파일 | 바꿀 것 |
|---|---|
| `components/BlogLibrary.tsx` | 대문자, 가운뎃점, `var(--accent)`(토큰으로 따라옴) |
| `components/MagazineViewer.tsx` | 인디고 하드코딩 → `var(--accent)`·그린 면. 가운뎃점(화면 문구). 대문자 |
| `components/magazine/MagazineIssueDetail.tsx` | "Mairangi Bay · Auckland · New Zealand" 등 가운뎃점. 대문자 |
| `components/MagazineShelf.tsx` | 대문자. 책등 날짜 "AUG 2026" 은 데이터라 표시 형식에서 처리 |
| `app/(public)/blog/tag/[tag]/page.tsx` | 가운뎃점, 대문자 |

- **`components/magazine/templates/**`(매거진 지면)는 건드리지 않는다.** 지면은 620×812 고정 캔버스이고 PNG 파이프라인 QA 대상이다(메모리 "매거진 고정 캔버스 체제"). mag-unit-guard 훅도 이것을 지킨다.
- 섹션 제목 h2 의 Playfair 이탤릭을 정체로 바꿀지(D6 의 남은 몫)는 시안 2개로 PeNnY 에게 묻는다.
- 성공 기준:
  - `/blog`·`/magazine`·이슈 상세에서 인디고 0, 보이는 가운뎃점 0, 대문자 변환 요소 0(지면 제외)
  - 3페이지 × 3폭 × 2테마 전후
  - audit 0, build·tsc 0
- 이슈 페이지는 하이드레이션 418 회귀를 감시한다(메모리 #149: `useId` 를 글자에 넣지 말 것). 콘솔 에러 0 을 확인한다.

### STEP 6 — 마무리
1. 라이브 최종 측정. Impeccable 홈·블로그 각 1회, DOM 3페이지, 판별표 5축 재채점. 이것을 11-03 수치와 STEP 1 기준선 수치에 나란히 놓는다. 결과는 `docs/qa/2026-11-xx-homepage/RESULT.md` 에 쓴다.
2. `UPGRADE_PLAN.md` 의 상태 칸과 기획안 Artifact(https://claude.ai/artifact/7v3TxY6y5dHexDMGLrAzt3)에 "반영 완료 + 결과 링크"를 적는다. Artifact 는 먼저 read 한 뒤 갱신한다.
3. 메모리 한 건을 남긴다(`project_homepage_design_de_default.md`). 반영된 결정, PR 링크, 남은 일을 적고 MEMORY.md 에 한 줄 추가한다.
4. 남은 일을 정리한다(아래 §6). 새 일은 이 세션에서 시작하지 않고 제안 카드로 올린다.

## 4. 금지 사항
- **화면 코드 변경은 PR 로만, 머지는 PeNnY 결재 후.** main 직접 push 금지. 문서 전용 PR(PR-0, 결과 문서)만 CI 통과 후 머지할 수 있다.
- 커밋은 파일을 하나씩 지정한다(`git add -u`·`git add .` 금지). zsh 에서는 배열 `FILES=(...)` + `"${FILES[@]}"` 로 넘긴다.
- 건드리지 않는 것:
  - `middleware.ts`, `app/mhj-desk/**`(관리자 인디고 121행은 범위 밖), DB 스키마, 뉴스레터 발송 경로
  - `.claude/protected-files.txt` 의 파일
  - dev 스크립트의 `--turbopack`
  - 매거진 지면 템플릿
- 아이 실명·"Heejong Jo" 가 화면, 캡처, alt, meta, PR 본문, 5초 테스트 이미지에 나오면 P0 다. 캡처 스크립트는 name-guard 패턴을 그대로 읽는다.
- Impeccable 은 `4.8.0` 고정으로, 단계 전후에 페이지당 1회씩만 돌린다. **건수를 줄이려고 고치지 않는다.** 남는 건수는 "진짜 문제 / 의도된 선택 / 오탐" 판정으로 설명한다.
- 이미지 생성 AI 호출 0. 새 사진 0. 있는 가족 사진만 쓴다.
- 호버는 opacity·scale 1.02~1.03 만 쓴다. 카드 반경은 12px 이하, 색은 토큰으로만 넣는다(하드코딩 금지).
- 1 PR = 1 단계. 수정 파일은 5개 이하다. 넘으면 나눈다.
- 범위 고정: 이 세션은 **홈페이지 디자인**만 한다. SEO 보강, 글 본문 수정, 감사 확장으로 새지 않는다. 발견한 것은 §6 에 적고 제안 카드로 올린다.

## 5. 완료 체크리스트
- **A. 범위**: PR 마다 수정 파일 5개 이하이고 §4 금지 경로는 0. `git diff --stat origin/main -- middleware.ts app/mhj-desk` = 0
- **B. 회귀**
  - 각 PR 에서 `audit-contrast`·`audit-a11y` 0
  - 라이브 `live-functional-check` 결함 0
  - 매거진 이슈 페이지 콘솔 에러 0
  - 다크 모드 3페이지 확인
- **C. 자가 검증**
  - 단계마다 3폭 × 2테마 전후 캡처와 짝 비교가 있다
  - 건수표의 건수 = JSON 건수
  - `/code-review`·`/verify` 실행 기록
- **D. Git**
  - PR-0(문서)·PR-1·PR-2·PR-3 링크
  - 각 PR CI 통과
  - 머지 결재를 준 PeNnY 메시지 인용
- **E. 산출물**
  - `docs/qa/2026-11-xx-homepage/`(기준선·단계별 숫자·RESULT.md)
  - 기획안 Artifact 갱신
  - 메모리 한 건
- **F. 성공 기준**
  - 라이브 DOM 3페이지 인디고 0·보이는 가운뎃점 0·대문자 변환 0(지면·로고 제외)
  - 본문·제목 웹폰트 렌더 확인
  - 5초 테스트 응답 수를 그대로 적는다
  - D1~D7 결정이 기록돼 있다
  - build 통과·tsc 0

## 6. 범위 밖으로 알고만 있을 것 (발견 시 제안 카드로)
- 관리자 화면 인디고 하드코딩 121행(`app/mhj-desk/**`) — 별도 작업
- 글 본문 HTML 안의 인라인 색(명암 2.4:1 등) — SQL 별도 결재
- `@import` → `next/font` 완전 이전(메모리 "폰트 이전 차단 사유": 하드코딩 폰트명 50곳 이상 + PNG 파이프라인 QA, feature 급)
- `REVALIDATION_SECRET` 로테이션 등 메모리에 남은 운영 일

## 7. 도구 메모
- Playwright 1.59.1(저장소 `node_modules`). 테마는 `localStorage 'mhj-theme'` + `colorScheme` 으로 정한다.
- Python 스크립트(`pairs.py`·`font-sheet.py`)는 PIL 이 사용자 경로에 있어 `-I` 없이 실행한다.
- `grep` 은 ugrep 별칭이라 `--accent` 를 옵션으로 읽는다 → `/usr/bin/grep -e '--accent'`.
- 백그라운드 서버는 도구 호출 사이에 죽을 수 있다. 미리보기는 Vercel PR 미리보기 URL 이 더 안정적이다.
- 측정 스크립트 모음: `docs/qa/2026-11-03-self-check/scripts/`(저장소 루트에서 실행). capture·dom-facts·detect-cdp·fonts·inventory·pairs·font-sheet.
