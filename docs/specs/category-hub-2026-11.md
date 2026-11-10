# 페이지 설계서 — `/blog/category/[slug]` 카테고리 허브 (2026-11-10)

> 근거: `docs/PLAN-homepage-next-2026-11.md` §4 4단계(우선순위 3번 = 카테고리 허브) · 양식 `docs/DESIGN_RULES.md` §18.3 · 점수 `docs/DESIGN_SCORECARD.md`.
> 허브 7곳은 `/blog` 와 같은 렌더러(`BlogListPage` → `components/BlogLibrary.tsx`)를 쓴다. **`/blog` 자체는 다음 단계(4번)** 라 이번엔 허브에서만 갈라지게 고친다. 예외: 카드 태그 줄 삭제는 같은 카드를 쓰는 `/blog` 에도 적용된다.
> 기준 화면: 운영 `/blog/category/settlement`(12편, Start here 있음) · `/blog/category/travelers`(1편).

## 0. 운영 기준 점수 (고치기 전, 0/3)

기계 탈락 검사: 2026-11-10 운영 QA 결함 0.

| # | 항목 | 점수 | 근거(숫자·위치) |
|---|---|---|---|
| 1 | 3초 첫인상 | 8 | 서랍 이름 + 소개 2~3줄 + Start here 3편 |
| 2 | 편집 위계 | 5 | Settlement: 성적표 글 링크 **4번**(Start here · Featured · 목록 · Reader Favorites), 다른 4편 2~3번. Featured + Recent 블록이 바로 아래 목록 1~5번과 같은 글 |
| 3 | 글자 | 7 | 카드마다 내부 태그 줄 "schoolreport · nzprimary" 가 글자로 보임 |
| 4 | 구성·여백 | 7 | |
| 5 | 색·빛 | 6 | Featured 카드 "READ STORY" 가 `--accent`(#4F46E5 남색) — 홈은 같은 자리를 `--text` 로 씀 |
| 6 | 사진 다루기 | 8 | |
| 7 | 읽기 편함 | 7 | 목록에 닿기까지 Featured 블록 약 520px(1440) 을 지나야 함 |
| 8 | 모바일 | 6 | 390 페이지 길이 8,271px, 그중 Featured + Recent 약 900px 가 중복 |
| 9 | 문구 | 7 | Travelers: "Recent Stories — No recent stories" 빈 상자 |
| 10 | 마감 | 6 | Reader Favorites 카드 폭 280·**430**·280·280·280px(긴 제목 카드만 늘어남) |
| | **평균** | **6.7** | **미달** |

## 0-1. 고친 뒤 점수 (1/3, 로컬 운영 빌드 3013, 2026-11-10)

기계 탈락 검사: 기능 126화면 결함 0 · 깜빡임 0 · 글꼴 대체 0 · 대비 0 · axe 0(허브 5곳 + /blog; 처음엔 Travelers 에서 h1→h3 건너뜀 2건 → 숨긴 h2 "All stories" 로 해결) · tsc 0 · build 통과. LCP/CLS 는 머지 후 운영에서.

| # | 항목 | 점수 | 근거 |
|---|---|---|---|
| 1 | 3초 첫인상 | 8 | 그대로 |
| 2 | 편집 위계 | 8 | 같은 글 링크 최대 4번 → 2번(Start here + 목록), Travelers 0번 |
| 3 | 글자 | 8 | 태그 줄 삭제 |
| 4 | 구성·여백 | 8 | 소개 → Start here → 목록 한 흐름 |
| 5 | 색·빛 | 8 | 허브에 남색 "READ STORY" 없음 |
| 6 | 사진 다루기 | 8 | |
| 7 | 읽기 편함 | 8 | Start here 바로 아래가 전체 목록 |
| 8 | 모바일 | 8 | 390 길이 8,271 → 6,777px, 중복 0 |
| 9 | 문구 | 8 | "No recent stories" 빈 상자 없음 |
| 10 | 마감 | 8 | Reader Favorites 카드 폭 280px 고정 |
| | **평균** | **8.0** | **통과** |

전후 비교(바뀐 곳 빨간 박스): `docs/qa/2026-11-10-hub/compare/`

범위 밖 발견: Travelers 글 제목 "Ruakākā" 의 장음 부호(ā)가 Noto 굵은 글씨에서 글자 뒤로 밀려 "Ruakāka¯" 처럼 보인다 — 글 데이터(결합 문자 U+0304 추정)·글꼴 문제라 따로.

## 1. 요약

**"이 서랍에 무엇이 있고, 어디서부터 읽으면 되는지."** 소개 → Start here → 전체 목록, 같은 글은 한 번(+Start here)만.

## 2. 글꼴

변경 없음(h1 Playfair 이탤릭 대문자 56/40px, 소개 `type-body`, 카드 제목 Noto 16px·700).

## 3. 색

변경 없음. 허브에서는 Featured 카드가 빠지므로 남색 "READ STORY" 도 허브에서 사라진다(`/blog` 의 것은 다음 단계).

## 4. 구역

| 순서 | 요소 | 바뀌는 것 | 기록 |
|---|---|---|---|
| 1 | 머리(서랍 이름 · 소개 · Start here) | 그대로 | — |
| 2 | Featured + Recent Stories | **허브에서 삭제**(`/blog` 는 그대로). 데이터 조회 2개도 건너뜀 | — |
| 3 | 서랍 알약 + 목록 | 카드의 **태그 줄 삭제**(전 페이지 공통) | — |
| 4 | Reader Favorites | 허브에서는 **이 서랍 글을 빼고 다른 서랍 인기 글만**. 2편 미만이면 띠 생략. 카드 폭 **280px 고정** | — |

## 5. 움직임

변경 없음.

## 6. 반응형

| 요소 | 1440 | 768 | 390 |
|---|---|---|---|
| 목록 | 4칸 | 2칸 | 1칸 (그대로) |
| 페이지 길이(Settlement) | 4,457px → 줄어듦 | | 8,271px → 줄어듦 |

## 7. 금지/필수

기본 목록 + `/blog`(서랍 선택 없음) 화면은 Featured + Recent 를 그대로 유지(다음 단계에서 따로 점수).
