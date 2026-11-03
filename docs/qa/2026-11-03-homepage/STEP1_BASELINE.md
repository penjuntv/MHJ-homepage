# STEP 1 — M0 라이브 검증과 새 기준선 (2026-11-03)

> 지시서: `~/StoryPress-Ops/design/2026-11-02-ai-free-design-research/handoff/2026-11-03_MHJ_homepage-design-session.md` §3 STEP 1
> 대상: 라이브 www.mhj.nz (main `4780aab`, M0 = PR #179 반영), 로그아웃 상태(새 Playwright 컨텍스트). 화면 코드 변경 0.

## 결론

**M0 통과.** 홈·블로그 상세·매거진 목록 × 1280·1194·390 의 9칸 모두에서 본문은 `Noto Sans KR`, 제목은 `Playfair Display` 가 **웹폰트로**(`isCustomFont: true`) 그려진다. 11-03 자가검증 때(본문 Helvetica, 제목은 이 Mac 에 깔린 Playfair `isCustomFont:false`)와 달라졌다. M1 로 넘어가도 된다(단 STEP 2 관문 뒤).

## 1. 웹폰트 렌더 (`fonts-render-base.json`, `scripts/render-fonts.mjs`)

측정 방식은 `self-check/scripts/fonts.mjs` 와 같다(CDP `CSS.getPlatformFontsForNode`). 다른 점은 글꼴 응답 수신기를 페이지 이동 **전에** 건 것이다(fonts.mjs 는 이동 뒤에 걸어 첫 로드분을 세지 못한다).

| 페이지 | 폭 | googleapis CSS | gstatic 글꼴 파일 | 본문 노드 → 그려진 글꼴 | 제목 노드 → 그려진 글꼴 |
|---|---|---:|---:|---|---|
| 홈 | 1280·1194·390 | 1 | 5 | `p` "A power cut hit…" → Noto Sans KR (web) ×140 | `h2` 900 "Mum's Birthday…" → Playfair Display (web) ×55 |
| 블로그 상세 | 1280·1194·390 | 1 | 14 | `p` "New Zealand's school system…" → Noto Sans KR (web) ×328~334 (+ Playfair ×1) | `h1` 900 "Starting School in New Zealand" → Playfair Display (web) ×29 |
| 매거진 목록 | 1280·1194·390 | 1 | 3 | `div` 책등 문구 → Noto Sans KR (web) ×37 | `h1` 900 "Magazine Shelf" → Playfair Display (web) ×14 |

- 9칸 모두 HTTP 200, `document.fonts` 에 `Noto Sans KR`·`Playfair Display` 가 `loaded` 상태로 있다(Inter 도 그대로 있음).
- CDP 가 본문 글꼴 이름을 `Noto Sans KR Thin` 으로 돌려준다. Google 이 보내는 **가변 글꼴 파일의 기본 인스턴스 이름**이라서다. 실제 굵기는 `font-weight`(400·500)대로 축이 적용된다. 캡처(`blog-1280-light.png`·`home-390-dark.png`)에서 본문이 가는 글씨가 아닌 보통 굵기로 보이는 것을 눈으로 확인했다.
- 블로그 본문 노드의 Playfair ×1 은 본문 안의 한 글자(드롭캡 계열)다. 결함 아님.
- 매거진 목록에는 40자 넘는 `p` 가 없어서, 본문 대신 Noto 로 선언된 20자 이상 요소(책등 문구)를 쟀다.

## 2. 새 기준선 캡처 18장

- 위치: `/Users/penny/MHJ_HOMEPAGE/qa-screenshots/2026-11-03-homepage/base/` (gitignore 대상, `_capture-log.json` 동봉)
- 홈·블로그·매거진 × 1280·1194·390 × 라이트·다크 = **18장**, 전부 HTTP 200. 다크 9컷 모두 `html.dark` 적용, 라이트 9컷 모두 미적용을 확인.
- **실명 검사 0건**(name-guard 패턴으로 본문·title·meta·img alt 검사, 18컷 모두 `nameHit:false`).
- 이 18장이 M1 전후 비교의 "전" 기준이다. 11-03 `self-check` 캡처는 M0 이전 화면이라 쓰지 않는다.

## 3. Impeccable 4.8.0 건수 (라이브 URL, 페이지당 1회)

건수 = JSON 건수: 홈 **44**(`impeccable-home-base.json`), 블로그 **33**(`impeccable-blog-base.json`).

| 규칙 | 등급 | 홈 11-03 | 홈 기준선 | 블로그 11-03 | 블로그 기준선 |
|---|---|---:|---:|---:|---:|
| `undersized-ui-text` | warning | 38 | 38 | 12 | 12 |
| `line-length` | warning | 0 | 0 | 16 | **9** |
| `kicker-above-heading` | warning | 1 | 1 | 3 | 3 |
| `low-contrast` | warning | 0 | 0 | 2 | 2 |
| `tiny-text` | warning | 1 | 1 | 0 | 0 |
| `italic-serif-display` | warning | 0 | 0 | 1 | 1 |
| `unbalanced-heading` | advisory | 1 | 1 | 2 | 2 |
| `undersized-ui-text` | advisory | 1 | 1 | 2 | 2 |
| `straggler` | advisory | 1 | **2** | 1 | 1 |
| `em-dash-overuse` | advisory | 0 | 0 | 1 | 1 |
| **합계** | | **43** | **44** | **40** | **33** |

(11-03 표의 `undersized-ui-text` warning 홈 36+2·블로그 10+2 는 묶음별로 나눈 것이고, 규칙 합은 위와 같다.)

**차이는 글꼴 변화 몫이다.**
- 블로그 `line-length` 16 → 9: Noto Sans KR 이 Helvetica 보다 글자 폭이 넓어 같은 600여 px 에 들어가는 글자 수가 줄었다. 남은 9건(본문 문단 5·안내 상자 3·FAQ `dd` 1)은 여전히 80자 초과라 M2 의 본문 폭 조정 대상이다.
- 홈 `straggler` 1 → 2: 줄바꿈 위치가 바뀌어 `.pillar-subtitle` 끝줄에 한 단어가 남았다. 경미(advisory).
- 그 밖의 규칙은 건수가 같다. 웹폰트는 크기·대문자·색을 바꾸지 않으므로 예상대로다.

## 4. DOM 계산값 (`dom-facts-base.json`, 1280)

| 항목 | 홈 | 블로그 상세 | 매거진 목록 |
|---|---|---|---|
| h1 선언 서체·대문자 | Noto Sans KR, uppercase | Playfair Display, uppercase | Playfair Display, none |
| 인디고 칠한 요소 | 1 | 7 | 1 |
| 브라운·그린 칠한 요소 | 21 | 11 | 10 |
| 대문자 요소(넓은 자간) | 59 (59) | 49 (46) | 43 (37) |
| 가운뎃점 텍스트 노드 보임/전체 | 16 / 27 | 2 / 4 | 6 / 12 |
| `--accent` 라이트 / 다크 | `#4F46E5` / `#818CF8` | 같음 | 같음 |

11-03 `dom-facts-A.json` 과 모든 숫자가 같다. M0 은 글꼴만 바꿨고 색·대문자·가운뎃점은 손대지 않았기 때문이다. M1~M3 가 줄여야 할 숫자는 이 표 그대로다.

## 파일

| 파일 | 내용 |
|---|---|
| `fonts-render-base.json` | 3페이지 × 3폭 렌더 글꼴(CDP 원본 `fonts` 배열 포함) |
| `impeccable-home-base.json` · `impeccable-blog-base.json` | `npx impeccable@4.8.0 detect <url> --json` (종료 코드 2 = 찾은 것 있음) |
| `dom-facts-base.json` | 홈·블로그·매거진 × 라이트·다크 계산값 |
| `scripts/render-fonts.mjs` | 1절 측정 스크립트(`BASE` 환경 변수 지원) |
