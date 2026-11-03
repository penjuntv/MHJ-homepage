# STEP 2 — 강조색·라벨 전수표 (2026-11-03)

> 지시서 §2 STEP 2. 대상은 `app/`·`components/` 의 `.ts`·`.tsx`·`.css`, 기준 커밋은 `20fcfcb`(main)이다.
> 관리자 폴더(`app/mhj-desk/`·`components/admin/`)는 이번 범위에서 "건드리지 않음"이라 표에서 빼고 건수만 적었다.
> 표는 `scripts/inventory.py`(`python3 -I docs/qa/2026-11-03-self-check/scripts/inventory.py . out.md`) 가 만든다. 같은 정의로 `/usr/bin/grep` 을 돌려 행 수를 스스로 대조한다.
> 명암비는 WCAG 2.x 상대 휘도 공식으로 계산했다(추정 아님). 기준은 본문 4.5:1, 큰 글자 3:1, 비텍스트 3:1(규칙서 §6.3).

## 읽는 법 — 결론 먼저

1. **인디고·보라는 공개 화면 46행, 실제 교체 대상은 42행이다.** 대부분 `app/globals.css`(토큰·포커스·AI Insight 다크)와 `AiInsight`·`MagazineViewer`·`BlogLibrary` 세 컴포넌트에 몰려 있다.
   - 토큰 `--accent` 두 줄(라이트 `globals.css:45`, 다크 `:123`)만 바꿔도 `var(--accent)` 를 쓰는 12행이 따라온다.
   - 나머지는 하드코딩이다. 특히 `AiInsight` 9행·`MagazineViewer` 7행이 그렇다.
2. **AI Insight 버튼·카드에 보라 그라데이션이 있다.**
   - 라이트: `AiInsight.tsx:55·81` `#EEF2FF → #F5F3FF → #FDF4FF`
   - 다크: `globals.css:876~878`·`:1606` `rgba(109,40,217)`·`rgba(147,51,234)`
   - 조사서가 꼽은 "흰 바탕 보라 그라데이션" 신호가 사이트에서 유일하게 "AI"라는 이름을 단 버튼에 붙어 있다. 시안 B 는 그라데이션 없이 단색 면으로 바꾼다.
3. **제안 색** (명암비는 라이트 흰/크림/warm, 다크 bg/surface/card 순서)
   - 상호작용 색 라이트 `#3E5F4A`(MHJ Green): 7.14 / 6.74 / 6.31. 지금 인디고 6.29 / 5.93 / 5.55 보다 오히려 높다.
   - 다크 `#8FB39B`: 8.57 / 7.95 / 7.22. 지금 `#818CF8` 은 6.64 / 6.16 / 5.59 다.
   - `#8FB39B` 는 브랜드 그린과 색상·채도가 같고 명도만 올린 **파생값**이다. 브랜드 키트에 없는 색이라 결정 항목으로 올린다.
   - 연한 면은 `#EEF2FF → #EEF3EF` 다. 그 위 강조 글자는 5.62:1 → 6.36:1 이 된다.
4. **브라운·그린 75행은 전부 유지다.** 다만 `#8A6B4F` 를 글자색으로 쓰는 공개 화면 행은 warm 면(`#F5F0EB`)에서 4.32:1 이다.
   - 작은 글자라면 AA 미달이다. 해당 행에 ⚠ 표시를 붙였다.
   - 다크에서는 `#C9A882`(8.87:1)로 뒤집히는지가 관건이다. `--number-accent` 처럼 짝이 있는 토큰은 안전하다. 하드코딩 행은 M 단계에서 확인한다.
5. **대문자 217행 가운데 공개 화면은 153행이다(51개 파일).**
   - 많은 순서: 홈 `page.tsx` 18, `BlogLibrary` 15, `globals.css` 15, `MagazineViewer` 14, 댓글 9, 블로그 상세 8, About 8.
   - 매거진 지면 41행·StoryPress 랜딩 19행은 각각 지면 예외(`MHJ_MAGAZINE_DESIGN_BIBLE.md`)와 §6.5 제품 팔레트 영역이라 "유지"로 두었다.
6. **가운뎃점 79행 가운데 화면에 나오는 공개 문구는 23행이다.** 나머지는 이렇다.
   - 주석 39
   - 지면·랜딩 12
   - 화면 밖 5: 메타 제목·메일·robots·llms 같은 텍스트
   - 홈 메타 줄(`page.tsx:766·801·802·979·980`)이 STEP 1 DOM 의 "by Yussi · 10 views · 2 Comments" 16노드의 출처다.

## 저장소 규칙과의 관계

- `DESIGN_RULES.md` §6.4 는 "인디고는 AI Insight·인터랙티브 요소에만"이라고 정해 두었다. 화면은 이 규칙을 지키고 있다(STEP 1: 칠한 요소 1~7개).
  시안 B 는 **규칙 위반을 고치는 것이 아니라 규칙 자체를 바꾸는 안**이다 → §6.4 개정 결재가 필요하다.
- `DESIGN_RULES.md` §5.2 "라벨/캡션 11px · letter-spacing 2px · uppercase", §10.1 카드 도식 "CATEGORY 11px uppercase" → 대문자 해제도 규칙 개정이 필요하다.
- CLAUDE.md 규칙 7(카드 반경 32px+ 금지)에 걸리는 것을 덤으로 찾았다: `.ai-reflection { border-radius: 32px }`(`globals.css:486`). 이번 범위 밖이라 기록만 한다.

## 표 열 설명

- **영역**: public(공개 화면) / storypress(제품 랜딩, §6.5) / magazine(지면 템플릿·캔버스·렌더 — 지면 예외) / admin-editor(`components/TipTapEditor.tsx`, `app/mhj-desk` 에서만 import) / nonscreen(API·robots·llms·메타) / og(OG 이미지).
- **역할**: text(글자) / text-dark(다크 전용 글자) / bg(면) / nontext(테두리·포커스·그림자, 3:1 기준) / 주석.
- **명암비**: text 는 그 색을 라이트 세 면(흰 `#FFFFFF`/크림 `#FAF8F5`/warm `#F5F0EB`) 위에서, text-dark 는 다크 세 면(`#0A0A0A`/`#161412`/`#1E1E1E`) 위에서 잰다. bg(연한 면)는 **그 면 위 강조 글자**를 잰다. 반투명 rgba 는 바탕에 따라 달라 숫자를 적지 않았다.

## 건수 대조 (verify: 행 수 = grep 건수)

| 갈래 | 표 행 수 | grep 건수 | 일치 | 파일 수 | 관리자 폴더(제외) |
|---|---:|---:|---|---:|---:|
| A. 인디고·보라 (`--accent`·인디고/보라 hex·rgba·Tailwind 클래스) | 67 | 67 | ✅ | 7 | 121 |
| B. 브라운·그린 (브랜드 키트) | 75 | 75 | ✅ | 33 | 5 |
| C. 대문자 (`uppercase`) | 217 | 217 | ✅ | 51 | 206 |
| D. 가운뎃점 (`·`) | 79 | 79 | ✅ | 26 | 70 |

| 갈래 | 공개 화면 | StoryPress 랜딩 | 매거진 지면 | 관리자 편집기 | 화면 밖 | OG 이미지 |
|---|---:|---:|---:|---:|---:|---:|
| IND | 46 | 9 | 0 | 12 | 0 | 0 |
| BG | 52 | 0 | 21 | 0 | 0 | 2 |
| UP | 153 | 19 | 41 | 2 | 0 | 2 |
| DOT | 51 | 9 | 12 | 0 | 7 | 0 |

## A. 인디고·보라 (`--accent`·인디고/보라 hex·rgba·Tailwind 클래스) — 67행 (grep 67건 · 관리자 폴더 121건은 범위 밖이라 제외)

```bash
/usr/bin/grep -rnEi --include=*.ts --include=*.tsx --include=*.css \
  -e 'var\(--accent[,)]|--accent:|#(4F46E5|6366F1|818CF8|A5B4FC|C7D2FE|EEF2FF|E0E7FF|312E81|4338CA|3730A3|1E1B4B|1B1B2E|F5F3FF|FDF4FF|EDE9FE|DDD6FE|C4B5FD|8B5CF6|7C3AED|6D28D9|9333EA|A855F7)([^0-9A-Fa-f]|$)|rgba?\( *(79, *70, *229|99, *102, *241|129, *140, *248|238, *242, *255|30, *27, *75|109, *40, *217|147, *51, *234|139, *92, *246)|indigo-[0-9]|violet-[0-9]|purple-[0-9]' app components \
  | grep -vE '^(app/mhj-desk/|components/admin/)' | wc -l
```

| # | 파일:줄 | 영역 | 용도 | 역할 | 현재 색 | 제안 색 | 명암비 (라이트 흰/크림/warm · 다크 bg/surface/card) |
|---:|---|---|---|---|---|---|---|
| 1 | `app/(public)/storypress/StoryPressClient.tsx:36` | storypress | StoryPressClient | bg | #EEF2FF | 유지 (§6.5 제품 팔레트) | — |
| 2 | `app/(public)/storypress/StoryPressClient.tsx:103` | storypress | StoryPressClient | bg | #EEF2FF | 유지 (§6.5 제품 팔레트) | — |
| 3 | `app/(public)/storypress/StoryPressClient.tsx:126` | storypress | StoryPressClient | bg | #EEF2FF | 유지 (§6.5 제품 팔레트) | — |
| 4 | `app/(public)/storypress/StoryPressClient.tsx:531` | storypress | StoryPressClient | text | #EEF2FF | 유지 (§6.5 제품 팔레트) | — |
| 5 | `app/(public)/storypress/StoryPressClient.tsx:640` | storypress | StoryPressClient | bg | #EEF2FF | 유지 (§6.5 제품 팔레트) | — |
| 6 | `app/(public)/storypress/StoryPressClient.tsx:641` | storypress | StoryPressClient | nontext | #C7D2FE | 유지 (§6.5 제품 팔레트) | — |
| 7 | `app/globals.css:45` | public | 토큰 `--accent` | text | #4F46E5 | #3E5F4A | 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 |
| 8 | `app/globals.css:57` | public | 토큰 `--callout-bg` | bg | #EEF2FF | #EEF3EF (면) | 면 위 강조 글자: #4F46E5 5.62 → #3E5F4A 6.36 |
| 9 | `app/globals.css:123` | public | 토큰 `--accent` (다크) | text-dark | #818CF8 | #8FB39B | 6.64 / 6.16 / 5.59 → 8.57 / 7.95 / 7.22 (다크 면) |
| 10 | `app/globals.css:128` | public | 토큰 `--callout-bg` (다크) | bg | #1B1B2E | #18201B (면) | 면 위 강조 글자: #818CF8 5.66 → #8FB39B 7.21 |
| 11 | `app/globals.css:158` | public | `.dark` | 주석 | #EEF2FF | 주석 안 (변경 대상 아님) | — |
| 12 | `app/globals.css:172` | storypress | 토큰 `--sp-onlight-accent` | 주석 | #EEF2FF | 주석 안 (변경 대상 아님) | — |
| 13 | `app/globals.css:173` | storypress | 토큰 `--sp-onlight-indigo` | 주석 | #EEF2FF | 주석 안 (변경 대상 아님) | — |
| 14 | `app/globals.css:176` | storypress | 토큰 `--sp-onlight-muted` | 주석 | #EEF2FF | 주석 안 (변경 대상 아님) | — |
| 15 | `app/globals.css:233` | public | `.skip-link` | nontext | `--accent` (#4F46E5 / 다크 #818CF8) | `--accent` 값만 교체 → 라이트 #3E5F4A / 다크 #8FB39B | 라이트 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 · 다크 6.64 / 6.16 / 5.59 → 8.57 / 7.95 / 7.22 (비텍스트 3:1 기준) |
| 16 | `app/globals.css:252` | public | `[tabindex]:focus-visible` | nontext | `--accent` (#4F46E5 / 다크 #818CF8) | `--accent` 값만 교체 → 라이트 #3E5F4A / 다크 #8FB39B | 라이트 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 · 다크 6.64 / 6.16 / 5.59 → 8.57 / 7.95 / 7.22 (비텍스트 3:1 기준) |
| 17 | `app/globals.css:258` | public | `textarea:focus-visible` | nontext | `--accent` (#4F46E5 / 다크 #818CF8) | `--accent` 값만 교체 → 라이트 #3E5F4A / 다크 #8FB39B | 라이트 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 · 다크 6.64 / 6.16 / 5.59 → 8.57 / 7.95 / 7.22 (비텍스트 3:1 기준) |
| 18 | `app/globals.css:260` | public | `textarea:focus-visible` | nontext | #4F46E5 반투명 | rgba(62,95,74,…) 같은 투명도 | — (반투명, 바탕에 따라 달라짐) |
| 19 | `app/globals.css:485` | public | `.ai-reflection` | bg | #EEF2FF 반투명 | rgba(238,243,239,…) 같은 투명도 | — (반투명, 바탕에 따라 달라짐) |
| 20 | `app/globals.css:487` | public | `.ai-reflection` | nontext | #4F46E5 반투명 | rgba(62,95,74,…) 같은 투명도 | — (반투명, 바탕에 따라 달라짐) |
| 21 | `app/globals.css:491` | public | `.dark .ai-reflection` | bg | #1E1B4B 반투명 | rgba(24,32,27,…) 같은 투명도 | — (반투명, 바탕에 따라 달라짐) |
| 22 | `app/globals.css:492` | public | `.dark .ai-reflection` | nontext | #818CF8 반투명 | rgba(143,179,155,…) 같은 투명도 | — (반투명, 바탕에 따라 달라짐) |
| 23 | `app/globals.css:498` | public | `.ai-reflection-text` | text | #312E81 | #2F4A39 | 11.42 / 10.78 / 10.09 → 9.72 / 9.17 / 8.59 |
| 24 | `app/globals.css:503` | public | `.dark .ai-reflection-text` | text-dark | #A5B4FC | #8FB39B | 9.93 / 9.22 / 8.36 → 8.57 / 7.95 / 7.22 (다크 면) |
| 25 | `app/globals.css:876` | public | `.dark .ai-insight-card` | bg | #4F46E5 반투명 | rgba(143,179,155,…) 같은 투명도 | — (반투명, 바탕에 따라 달라짐) |
| 26 | `app/globals.css:877` | public | `.dark .ai-insight-card` | bg | 보라 #6D28D9 반투명 | 그라데이션 삭제 (단색 면) | — (반투명, 바탕에 따라 달라짐) |
| 27 | `app/globals.css:878` | public | `.dark .ai-insight-card` | bg | 보라 #9333EA 반투명 | 그라데이션 삭제 (단색 면) | — (반투명, 바탕에 따라 달라짐) |
| 28 | `app/globals.css:882` | public | `.dark .ai-insight-card p:last-of-type` | text-dark | #A5B4FC | #8FB39B | 9.93 / 9.22 / 8.36 → 8.57 / 7.95 / 7.22 (다크 면) |
| 29 | `app/globals.css:886` | public | `.dark .ai-insight-card .font-display` | text-dark | #C7D2FE | #C9D9CE | 13.27 / 12.32 / 11.18 → 13.48 / 12.51 / 11.35 (다크 면) |
| 30 | `app/globals.css:1012` | public | `.blog-content li` | 주석 | #4F46E5 | 주석 안 (변경 대상 아님) | — |
| 31 | `app/globals.css:1013` | public | `.blog-content a` | text | `--accent` (#4F46E5 / 다크 #818CF8) | `--accent` 값만 교체 → 라이트 #3E5F4A / 다크 #8FB39B | 라이트 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 · 다크 6.64 / 6.16 / 5.59 → 8.57 / 7.95 / 7.22 |
| 32 | `app/globals.css:1098` | public | `.blog-content .blog-callout` | nontext | `--accent` (#4F46E5 / 다크 #818CF8) | `--accent` 값만 교체 → 라이트 #3E5F4A / 다크 #8FB39B | 라이트 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 · 다크 6.64 / 6.16 / 5.59 → 8.57 / 7.95 / 7.22 (비텍스트 3:1 기준) |
| 33 | `app/globals.css:1276` | public | `.dark .blog-content:not(.blog-content--cont)>p` | text | `--accent` (#4F46E5 / 다크 #818CF8) | `--accent` 값만 교체 → 라이트 #3E5F4A / 다크 #8FB39B | 라이트 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 · 다크 6.64 / 6.16 / 5.59 → 8.57 / 7.95 / 7.22 |
| 34 | `app/globals.css:1606` | public | `.dark .comment-toast` | bg | #4F46E5 반투명 | rgba(143,179,155,…) 같은 투명도 | — (반투명, 바탕에 따라 달라짐) |
| 35 | `app/globals.css:1607` | public | `.dark .comment-toast` | text-dark | #A5B4FC | #8FB39B | 9.93 / 9.22 / 8.36 → 8.57 / 7.95 / 7.22 (다크 면) |
| 36 | `components/AiInsight.tsx:55` | public | AiInsight | bg | #EEF2FF | #EEF3EF (면) — 그라데이션 없이 단색 | 면 위 강조 글자: #4F46E5 5.62 → #3E5F4A 6.36 |
| 37 | `components/AiInsight.tsx:56` | public | AiInsight | text | #4F46E5 | #3E5F4A | 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 |
| 38 | `components/AiInsight.tsx:58` | public | AiInsight | nontext | #4F46E5 반투명 | rgba(62,95,74,…) 같은 투명도 | — (반투명, 바탕에 따라 달라짐) |
| 39 | `components/AiInsight.tsx:81` | public | AiInsight | bg | #EEF2FF | #EEF3EF (면) — 그라데이션 없이 단색 | 면 위 강조 글자: #4F46E5 5.62 → #3E5F4A 6.36 |
| 40 | `components/AiInsight.tsx:90` | public | AiInsight | bg | #4F46E5 반투명 | rgba(62,95,74,…) 같은 투명도 | — (반투명, 바탕에 따라 달라짐) |
| 41 | `components/AiInsight.tsx:103` | public | AiInsight | text | #4F46E5 반투명 | rgba(62,95,74,…) 같은 투명도 | — (반투명, 바탕에 따라 달라짐) |
| 42 | `components/AiInsight.tsx:119` | public | AiInsight | text | #6366F1 | #3E5F4A | 4.47 / 4.21 / 3.94 → 7.14 / 6.74 / 6.31 |
| 43 | `components/AiInsight.tsx:133` | public | AiInsight | text | #3730A3 | #2F4A39 | 9.93 / 9.37 / 8.77 → 9.72 / 9.17 / 8.59 |
| 44 | `components/AiInsight.tsx:151` | public | AiInsight | text-dark | #818CF8 | #8FB39B | 6.64 / 6.16 / 5.59 → 8.57 / 7.95 / 7.22 (다크 면) |
| 45 | `components/BlogLibrary.tsx:191` | public | BlogLibrary | text | `--accent` (#4F46E5 / 다크 #818CF8) | `--accent` 값만 교체 → 라이트 #3E5F4A / 다크 #8FB39B | 라이트 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 · 다크 6.64 / 6.16 / 5.59 → 8.57 / 7.95 / 7.22 |
| 46 | `components/BlogLibrary.tsx:418` | public | BlogLibrary | text | `--accent` (#4F46E5 / 다크 #818CF8) | `--accent` 값만 교체 → 라이트 #3E5F4A / 다크 #8FB39B | 라이트 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 · 다크 6.64 / 6.16 / 5.59 → 8.57 / 7.95 / 7.22 |
| 47 | `components/BlogLibrary.tsx:483` | public | BlogLibrary | text | `--accent` (#4F46E5 / 다크 #818CF8) | `--accent` 값만 교체 → 라이트 #3E5F4A / 다크 #8FB39B | 라이트 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 · 다크 6.64 / 6.16 / 5.59 → 8.57 / 7.95 / 7.22 |
| 48 | `components/DownloadBtn.tsx:106` | public | DownloadBtn | text | #4F46E5 | #3E5F4A | 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 |
| 49 | `components/MagazineViewer.tsx:977` | public | MagazineViewer | text | #4F46E5 | #3E5F4A | 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 |
| 50 | `components/MagazineViewer.tsx:982` | public | MagazineViewer | nontext | #4F46E5 반투명 | rgba(62,95,74,…) 같은 투명도 | — (반투명, 바탕에 따라 달라짐) |
| 51 | `components/MagazineViewer.tsx:1027` | public | MagazineViewer | bg | #4F46E5 | #3E5F4A | 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 |
| 52 | `components/MagazineViewer.tsx:1303` | public | MagazineViewer | bg | #C7D2FE | #C9D9CE (면) | 면 위 강조 글자: #4F46E5 4.22 → #3E5F4A 4.86 |
| 53 | `components/MagazineViewer.tsx:1304` | public | MagazineViewer | bg | #DDD6FE | #D9E4DC (면) | 면 위 강조 글자: #4F46E5 4.53 → #3E5F4A 5.47 |
| 54 | `components/MagazineViewer.tsx:1305` | public | MagazineViewer | bg | #E0E7FF | #E3ECE6 (면) | 면 위 강조 글자: #4F46E5 5.10 → #3E5F4A 5.92 |
| 55 | `components/MagazineViewer.tsx:1313` | public | MagazineViewer | bg | #4F46E5 | #3E5F4A | 6.29 / 5.93 / 5.55 → 7.14 / 6.74 / 6.31 |
| 56 | `components/TipTapEditor.tsx:184` | admin-editor | TipTapEditor | bg | #EEF2FF | 관리자 편집기 — 공개 본문과 맞출 때 함께(선택) | — |
| 57 | `components/TipTapEditor.tsx:240` | admin-editor | TipTapEditor | nontext | #4F46E5 | 관리자 편집기 — 공개 본문과 맞출 때 함께(선택) | — |
| 58 | `components/TipTapEditor.tsx:263` | admin-editor | TipTapEditor | nontext | #4F46E5 | 관리자 편집기 — 공개 본문과 맞출 때 함께(선택) | — |
| 59 | `components/TipTapEditor.tsx:276` | admin-editor | TipTapEditor | nontext | #4F46E5 | 관리자 편집기 — 공개 본문과 맞출 때 함께(선택) | — |
| 60 | `components/TipTapEditor.tsx:348` | admin-editor | TipTapEditor | nontext | #4F46E5 | 관리자 편집기 — 공개 본문과 맞출 때 함께(선택) | — |
| 61 | `components/TipTapEditor.tsx:903` | admin-editor | TipTapEditor | text | #4F46E5 | 관리자 편집기 — 공개 본문과 맞출 때 함께(선택) | — |
| 62 | `components/TipTapEditor.tsx:912` | admin-editor | TipTapEditor | bg | #EEF2FF | 관리자 편집기 — 공개 본문과 맞출 때 함께(선택) | — |
| 63 | `components/TipTapEditor.tsx:913` | admin-editor | TipTapEditor | nontext | #4F46E5 | 관리자 편집기 — 공개 본문과 맞출 때 함께(선택) | — |
| 64 | `components/TipTapEditor.tsx:972` | admin-editor | TipTapEditor | nontext | #4F46E5 | 관리자 편집기 — 공개 본문과 맞출 때 함께(선택) | — |
| 65 | `components/TipTapEditor.tsx:973` | admin-editor | TipTapEditor | bg | #EEF2FF | 관리자 편집기 — 공개 본문과 맞출 때 함께(선택) | — |
| 66 | `components/TipTapEditor.tsx:976` | admin-editor | TipTapEditor | text | #4F46E5 | 관리자 편집기 — 공개 본문과 맞출 때 함께(선택) | — |
| 67 | `components/TipTapEditor.tsx:1151` | admin-editor | TipTapEditor | text | #4F46E5 | 관리자 편집기 — 공개 본문과 맞출 때 함께(선택) | — |

## B. 브라운·그린 (브랜드 키트) — 75행 (grep 75건 · 관리자 폴더 5건은 범위 밖이라 제외)

```bash
/usr/bin/grep -rnEi --include=*.ts --include=*.tsx --include=*.css \
  -e '#(8A6B4F|C9A882|3E5F4A)([^0-9A-Fa-f]|$)|rgba?\( *(138, *107, *79|201, *168, *130|62, *95, *74)|var\(--(mhj-brown|mhj-brown-dark|mhj-green|number-accent)[,)]' app components \
  | grep -vE '^(app/mhj-desk/|components/admin/)' | wc -l
```

| # | 파일:줄 | 영역 | 용도 | 역할 | 현재 색 | 제안 색 | 명암비 (라이트 흰/크림/warm · 다크 bg/surface/card) |
|---:|---|---|---|---|---|---|---|
| 1 | `app/(public)/about/page.tsx:348` | public | (public)/about/page | nontext | #8A6B4F | 유지 (브랜드 키트) | 4.89 / 4.61 / 4.32 (비텍스트 3:1 기준) |
| 2 | `app/(public)/blog/[slug]/CommentSection.tsx:23` | public | CommentSection | bg | #8A6B4F | 유지 (브랜드 키트) | 4.89 / 4.61 / 4.32 |
| 3 | `app/(public)/blog/[slug]/ReadingProgress.tsx:56` | public | ReadingProgress | bg | #8A6B4F | 유지 (브랜드 키트) | 4.89 / 4.61 / 4.32 |
| 4 | `app/(public)/magazine/[id]/[slug]/page.tsx:154` | public | [id]/[slug]/page | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 5 | `app/(public)/page.tsx:422` | public | app/(public)/page | bg | #8A6B4F | 유지 (브랜드 키트) | 4.89 / 4.61 / 4.32 |
| 6 | `app/(public)/page.tsx:524` | public | app/(public)/page | bg | #8A6B4F | 유지 (브랜드 키트) | 4.89 / 4.61 / 4.32 |
| 7 | `app/(public)/page.tsx:549` | public | app/(public)/page | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 8 | `app/(public)/page.tsx:1084` | public | app/(public)/page | bg | #8A6B4F | 유지 (브랜드 키트) | 4.89 / 4.61 / 4.32 |
| 9 | `app/api/og/route.tsx:50` | og | api/og/route | bg | #8A6B4F | 유지 (브랜드 키트) | 4.89 / 4.61 / 4.32 |
| 10 | `app/api/og/route.tsx:78` | og | api/og/route | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 11 | `app/globals.css:20` | public | 토큰 `--mhj-brown` | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 12 | `app/globals.css:22` | public | 토큰 `--mhj-green` | text | #3E5F4A | 유지 (브랜드 키트) | 7.14 / 6.74 / 6.31 |
| 13 | `app/globals.css:23` | public | 토큰 `--mhj-brown-dark` | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 14 | `app/globals.css:73` | public | 토큰 `--number-accent` | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 15 | `app/globals.css:135` | public | 토큰 `--number-accent` (다크) | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 16 | `app/globals.css:925` | public | `.blog-content:not(.blog-content--cont) > p:fir` | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 17 | `app/globals.css:928` | public | `.dark .blog-content:not(.blog-content--cont) >` | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 18 | `app/globals.css:936` | public | `.blog-dateline` | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 19 | `app/globals.css:942` | public | `.dark .blog-dateline` | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 20 | `app/globals.css:962` | public | `.mhj-logo-child-name` | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 21 | `app/globals.css:968` | public | `.dark .mhj-logo-child-name` | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 22 | `app/globals.css:2152` | public | `.mn-issue-num` | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 23 | `app/globals.css:2155` | public | `.dark .mn-issue-num` | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 24 | `app/globals.css:2238` | public | `.home-pillars-rule` | bg | #8A6B4F | 유지 (브랜드 키트) | 4.89 / 4.61 / 4.32 |
| 25 | `app/globals.css:2269` | public | `.pillar-name` | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 26 | `app/globals.css:2273` | public | `.dark .pillar-name` | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 27 | `app/globals.css:2307` | public | `.pillar-read-arrow` | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 28 | `app/globals.css:2311` | public | `.dark .pillar-read-arrow` | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 29 | `app/globals.css:2429` | public | `.letter-stamp` | nontext | #8A6B4F | 유지 (브랜드 키트) | 4.89 / 4.61 / 4.32 (비텍스트 3:1 기준) |
| 30 | `app/globals.css:2434` | public | `.dark .letter-stamp` | nontext | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) (비텍스트 3:1 기준) |
| 31 | `app/globals.css:2439` | public | `.letter-stamp-dot` | bg | #8A6B4F | 유지 (브랜드 키트) | 4.89 / 4.61 / 4.32 |
| 32 | `app/globals.css:2441` | public | `.dark .letter-stamp-dot` | bg | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 33 | `app/globals.css:2448` | public | `.letter-dateline` | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 34 | `app/globals.css:2452` | public | `.dark .letter-dateline` | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 35 | `app/globals.css:2501` | public | `.letter-hover-sig` | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 36 | `app/globals.css:2505` | public | `.dark .letter-hover-sig` | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 37 | `app/globals.css:2529` | public | `.blog-letter-signoff` | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 38 | `app/globals.css:2532` | public | `.dark .blog-letter-signoff` | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 39 | `app/internal/render/article-page/[page_id]/page.tsx:35` | magazine | article-page/[page_id]/page | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 40 | `app/internal/render/article/[id]/page.tsx:27` | magazine | article/[id]/page | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 41 | `components/BlogLibrary.tsx:789` | public | BlogLibrary | bg | #8A6B4F | 유지 (브랜드 키트) | 4.89 / 4.61 / 4.32 |
| 42 | `components/Footer.tsx:88` | public | Footer | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 43 | `components/MagazineShelf.tsx:303` | public | MagazineShelf | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 44 | `components/MagazineShelf.tsx:384` | public | MagazineShelf | bg | #8A6B4F | 유지 (브랜드 키트) | 4.89 / 4.61 / 4.32 |
| 45 | `components/MagazineShelf.tsx:481` | public | MagazineShelf | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 46 | `components/Navigation.tsx:42` | public | Navigation | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 47 | `components/Navigation.tsx:252` | public | Navigation | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 48 | `components/Navigation.tsx:265` | public | Navigation | bg | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 49 | `components/Navigation.tsx:281` | public | Navigation | text | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 50 | `components/Navigation.tsx:296` | public | Navigation | bg | #C9A882 | 유지 (브랜드 키트) | 8.87 / 8.23 / 7.47 (다크 면) |
| 51 | `components/magazine/ArticlePageRenderer.tsx:157` | magazine | ArticlePageRenderer | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 52 | `components/magazine/MagazineIssueDetail.tsx:17` | public | MagazineIssueDetail | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 53 | `components/magazine/MagazineIssueDetail.tsx:110` | public | MagazineIssueDetail | bg | #8A6B4F | 유지 (브랜드 키트) | 4.89 / 4.61 / 4.32 |
| 54 | `components/magazine/MagazineIssueDetail.tsx:187` | public | MagazineIssueDetail | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 55 | `components/magazine/MagazineIssueDetail.tsx:323` | public | MagazineIssueDetail | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 56 | `components/magazine/MagazineIssueDetail.tsx:343` | public | MagazineIssueDetail | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 57 | `components/magazine/MagazineIssueDetail.tsx:370` | public | MagazineIssueDetail | text | #8A6B4F | 유지 (브랜드 키트) ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인 | 4.89 / 4.61 / 4.32 |
| 58 | `components/magazine/MagazineSpreadViewer.tsx:134` | magazine | MagazineSpreadViewer | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 59 | `components/magazine/PageThumbnail.tsx:156` | magazine | PageThumbnail | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 60 | `components/magazine/templates/ClassicTemplate.tsx:13` | magazine | ClassicTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 61 | `components/magazine/templates/ColumnLayoutTemplate.tsx:9` | magazine | ColumnLayoutTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 62 | `components/magazine/templates/DirectoryTemplate.tsx:6` | magazine | DirectoryTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 63 | `components/magazine/templates/FeatureHalfTemplate.tsx:9` | magazine | FeatureHalfTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 64 | `components/magazine/templates/LittleNotesTemplate.tsx:15` | magazine | LittleNotesTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 65 | `components/magazine/templates/MiddleTemplate.tsx:9` | magazine | MiddleTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 66 | `components/magazine/templates/MumsNoteTemplate.tsx:8` | magazine | MumsNoteTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 67 | `components/magazine/templates/PhotoEssayTemplate.tsx:72` | magazine | PhotoEssayTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 68 | `components/magazine/templates/PhotoHeroTemplate.tsx:16` | magazine | PhotoHeroTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 69 | `components/magazine/templates/PullQuoteTemplate.tsx:6` | magazine | PullQuoteTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 70 | `components/magazine/templates/SidebarTemplate.tsx:9` | magazine | SidebarTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 71 | `components/magazine/templates/SpecialTemplate.tsx:13` | magazine | SpecialTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 72 | `components/magazine/templates/SplitTemplate.tsx:6` | magazine | SplitTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 73 | `components/magazine/templates/Story2Template.tsx:6` | magazine | Story2Template | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 74 | `components/magazine/templates/TextOnlyTemplate.tsx:6` | magazine | TextOnlyTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |
| 75 | `components/magazine/templates/TitleCardTemplate.tsx:6` | magazine | TitleCardTemplate | text | #8A6B4F | 유지 (매거진 지면 예외) | — |

## C. 대문자 (`uppercase`) — 217행 (grep 217건 · 관리자 폴더 206건은 범위 밖이라 제외)

```bash
/usr/bin/grep -rnEi --include=*.ts --include=*.tsx --include=*.css \
  -e 'uppercase' app components \
  | grep -vE '^(app/mhj-desk/|components/admin/)' \
  | grep -vE ':[0-9]+:[[:space:]]*(//|/\*|\*|\{/\*)' | wc -l
```

| # | 파일:줄 | 영역 | 용도 | 제안 (시안 B) | 줄 내용 |
|---:|---|---|---|---|---|
| 1 | `app/(public)/about/page.tsx:163` | public | (public)/about/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 6, color: 'rgba(255,255,255,0.25)` |
| 2 | `app/(public)/about/page.tsx:175` | public | (public)/about/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color` |
| 3 | `app/(public)/about/page.tsx:213` | public | (public)/about/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 4 | `app/(public)/about/page.tsx:261` | public | (public)/about/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 5 | `app/(public)/about/page.tsx:307` | public | (public)/about/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 6 | `app/(public)/about/page.tsx:404` | public | (public)/about/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 7 | `app/(public)/about/page.tsx:432` | public | (public)/about/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 8 | `app/(public)/about/page.tsx:470` | public | (public)/about/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 9 | `app/(public)/blog/[slug]/CommentSection.tsx:138` | public | CommentSection | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 10 | `app/(public)/blog/[slug]/CommentSection.tsx:161` | public | CommentSection | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 11 | `app/(public)/blog/[slug]/CommentSection.tsx:187` | public | CommentSection | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 12 | `app/(public)/blog/[slug]/CommentSection.tsx:228` | public | CommentSection | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 13 | `app/(public)/blog/[slug]/CommentSection.tsx:250` | public | CommentSection | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 14 | `app/(public)/blog/[slug]/CommentSection.tsx:319` | public | CommentSection | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 15 | `app/(public)/blog/[slug]/CommentSection.tsx:363` | public | CommentSection | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 16 | `app/(public)/blog/[slug]/CommentSection.tsx:425` | public | CommentSection | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 17 | `app/(public)/blog/[slug]/CommentSection.tsx:507` | public | CommentSection | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p className="font-black uppercase" style={{` |
| 18 | `app/(public)/blog/[slug]/RelatedCard.tsx:42` | public | RelatedCard | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 19 | `app/(public)/blog/[slug]/page.tsx:305` | public | blog/[slug]/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase', flexShrink: 0,` |
| 20 | `app/(public)/blog/[slug]/page.tsx:345` | public | blog/[slug]/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 21 | `app/(public)/blog/[slug]/page.tsx:369` | public | blog/[slug]/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 22 | `app/(public)/blog/[slug]/page.tsx:393` | public | blog/[slug]/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 23 | `app/(public)/blog/[slug]/page.tsx:420` | public | blog/[slug]/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 24 | `app/(public)/blog/[slug]/page.tsx:594` | public | blog/[slug]/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 25 | `app/(public)/blog/[slug]/page.tsx:638` | public | blog/[slug]/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 26 | `app/(public)/blog/[slug]/page.tsx:693` | public | blog/[slug]/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p className="font-black uppercase" style={{` |
| 27 | `app/(public)/blog/tag/[tag]/page.tsx:66` | public | tag/[tag]/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `letterSpacing: 3, textTransform: 'uppercase',` |
| 28 | `app/(public)/blog/tag/[tag]/page.tsx:75` | public | tag/[tag]/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)'` |
| 29 | `app/(public)/blog/tag/[tag]/page.tsx:125` | public | tag/[tag]/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, color: 'rgba(255,255,255,0.6)'` |
| 30 | `app/(public)/gallery/GalleryClient.tsx:82` | public | GalleryClient | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 6, color: 'var(-` |
| 31 | `app/(public)/gallery/GalleryClient.tsx:115` | public | GalleryClient | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase', cursor: 'pointer',` |
| 32 | `app/(public)/gallery/GalleryClient.tsx:129` | public | GalleryClient | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p className="font-black uppercase" style={{ fontSize: 11, letterSpacing: 4 }}>No photos</` |
| 33 | `app/(public)/gallery/GalleryClient.tsx:184` | public | GalleryClient | 대문자 해제 (문장형, 자간 ≤0.02em) | `<span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase'` |
| 34 | `app/(public)/gallery/GalleryClient.tsx:197` | public | GalleryClient | 대문자 해제 (문장형, 자간 ≤0.02em) | `fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase',` |
| 35 | `app/(public)/gallery/GalleryClient.tsx:279` | public | GalleryClient | 대문자 해제 (문장형, 자간 ≤0.02em) | `fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: 'white'` |
| 36 | `app/(public)/gallery/GalleryClient.tsx:293` | public | GalleryClient | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', co` |
| 37 | `app/(public)/magazine/[id]/[slug]/page.tsx:226` | public | [id]/[slug]/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `<div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'v` |
| 38 | `app/(public)/magazine/[id]/[slug]/page.tsx:245` | public | [id]/[slug]/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `<div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'v` |
| 39 | `app/(public)/media-kit/page.tsx:129` | public | (public)/media-kit/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 40 | `app/(public)/media-kit/page.tsx:191` | public | (public)/media-kit/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 41 | `app/(public)/media-kit/page.tsx:216` | public | (public)/media-kit/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 42 | `app/(public)/media-kit/page.tsx:241` | public | (public)/media-kit/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 43 | `app/(public)/media-kit/page.tsx:271` | public | (public)/media-kit/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 44 | `app/(public)/media-kit/page.tsx:294` | public | (public)/media-kit/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 45 | `app/(public)/media-kit/page.tsx:365` | public | (public)/media-kit/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 46 | `app/(public)/page.tsx:320` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 47 | `app/(public)/page.tsx:416` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 48 | `app/(public)/page.tsx:445` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 49 | `app/(public)/page.tsx:471` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 50 | `app/(public)/page.tsx:502` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 51 | `app/(public)/page.tsx:518` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 52 | `app/(public)/page.tsx:562` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 53 | `app/(public)/page.tsx:647` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 54 | `app/(public)/page.tsx:692` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 55 | `app/(public)/page.tsx:762` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 56 | `app/(public)/page.tsx:803` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `<span style={{ fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: 'var(` |
| 57 | `app/(public)/page.tsx:845` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 58 | `app/(public)/page.tsx:925` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 59 | `app/(public)/page.tsx:1010` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase', color: 'var(--text-tertiary)',` |
| 60 | `app/(public)/page.tsx:1051` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase', color: 'var(--text-secondary)',` |
| 61 | `app/(public)/page.tsx:1113` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 62 | `app/(public)/page.tsx:1167` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 63 | `app/(public)/page.tsx:1274` | public | app/(public)/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 64 | `app/(public)/privacy/page.tsx:62` | public | (public)/privacy/page | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 65 | `app/(public)/storypress/StoryPressClient.tsx:170` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `<p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', c` |
| 66 | `app/(public)/storypress/StoryPressClient.tsx:196` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 40px', bord` |
| 67 | `app/(public)/storypress/StoryPressClient.tsx:202` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borde` |
| 68 | `app/(public)/storypress/StoryPressClient.tsx:286` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `<p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--sp-body)', text` |
| 69 | `app/(public)/storypress/StoryPressClient.tsx:351` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `textTransform: 'uppercase',` |
| 70 | `app/(public)/storypress/StoryPressClient.tsx:388` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `<p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--sp-body)', text` |
| 71 | `app/(public)/storypress/StoryPressClient.tsx:467` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `<p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--sp-body)', text` |
| 72 | `app/(public)/storypress/StoryPressClient.tsx:516` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `<p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', c` |
| 73 | `app/(public)/storypress/StoryPressClient.tsx:555` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `<span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase'` |
| 74 | `app/(public)/storypress/StoryPressClient.tsx:580` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `<p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--sp-body)', text` |
| 75 | `app/(public)/storypress/StoryPressClient.tsx:644` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `<span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase'` |
| 76 | `app/(public)/storypress/StoryPressClient.tsx:707` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `<p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--sp-onlight-acce` |
| 77 | `app/(public)/storypress/StoryPressClient.tsx:778` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `textTransform: 'uppercase', color: 'var(--text-tertiary)',` |
| 78 | `app/(public)/storypress/StoryPressClient.tsx:803` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `textTransform: 'uppercase', color: 'var(--sp-ondark-muted)',` |
| 79 | `app/(public)/storypress/StoryPressClient.tsx:828` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `className="font-black uppercase"` |
| 80 | `app/(public)/storypress/StoryPressClient.tsx:855` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',` |
| 81 | `app/(public)/unsubscribe/_client.tsx:55` | public | (public)/unsubscribe/_client | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 82 | `app/(public)/unsubscribe/_client.tsx:99` | public | (public)/unsubscribe/_client | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 83 | `app/(public)/unsubscribe/_client.tsx:138` | public | (public)/unsubscribe/_client | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 84 | `app/(public)/unsubscribe/_client.tsx:253` | public | (public)/unsubscribe/_client | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 85 | `app/(public)/unsubscribe/_client.tsx:270` | public | (public)/unsubscribe/_client | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 86 | `app/api/og/route.tsx:113` | og | api/og/route | OG 이미지 — M3 에서 함께 | `textTransform: 'uppercase',` |
| 87 | `app/api/og/route.tsx:173` | og | api/og/route | OG 이미지 — M3 에서 함께 | `textTransform: 'uppercase',` |
| 88 | `app/globals.css:320` | public | `.type-caption` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 89 | `app/globals.css:419` | public | `.spine-title` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 90 | `app/globals.css:432` | public | `.cover-title` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 91 | `app/globals.css:443` | public | `.hero-title` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 92 | `app/globals.css:454` | public | `.modal-title` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 93 | `app/globals.css:571` | public | `.shelf-issue-label` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 94 | `app/globals.css:1143` | public | `.blog-faq h2` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 95 | `app/globals.css:2055` | public | `.newsletter-cta-inline button[type="submit"]` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 96 | `app/globals.css:2119` | public | `.mn-subscriber-count` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 97 | `app/globals.css:2151` | public | `.mn-issue-num` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 98 | `app/globals.css:2192` | public | `.mn-back` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 99 | `app/globals.css:2231` | public | `.home-pillars-label` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 100 | `app/globals.css:2319` | public | `.pillar-empty` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 101 | `app/globals.css:2370` | public | `.adjacent-card-label` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 102 | `app/globals.css:2447` | public | `.letter-dateline` | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 103 | `components/AiInsight.tsx:62` | public | AiInsight | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase' as const,` |
| 104 | `components/AiInsight.tsx:118` | public | AiInsight | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 105 | `components/AiInsight.tsx:150` | public | AiInsight | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase' as const,` |
| 106 | `components/AuthorBox.tsx:28` | public | AuthorBox | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', c` |
| 107 | `components/AuthorBox.tsx:37` | public | AuthorBox | 대문자 해제 (문장형, 자간 ≤0.02em) | `style={{ display: 'inline-block', marginTop: 16, fontSize: 11, fontWeight: 900, letterSpac` |
| 108 | `components/BlogLibrary.tsx:76` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)'` |
| 109 | `components/BlogLibrary.tsx:82` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 110 | `components/BlogLibrary.tsx:95` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `<h2 style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', ` |
| 111 | `components/BlogLibrary.tsx:135` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase', color: 'var(--text-secondary)',` |
| 112 | `components/BlogLibrary.tsx:176` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', c` |
| 113 | `components/BlogLibrary.tsx:184` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ fontSize: 11, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', c` |
| 114 | `components/BlogLibrary.tsx:264` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 115 | `components/BlogLibrary.tsx:296` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 116 | `components/BlogLibrary.tsx:374` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `<span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase'` |
| 117 | `components/BlogLibrary.tsx:378` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `<span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase'` |
| 118 | `components/BlogLibrary.tsx:417` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',` |
| 119 | `components/BlogLibrary.tsx:497` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `<span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacin` |
| 120 | `components/BlogLibrary.tsx:559` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase', color: 'var(--text-secondary)',` |
| 121 | `components/BlogLibrary.tsx:663` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, color: 'var(--text-tertiary)'` |
| 122 | `components/BlogLibrary.tsx:800` | public | BlogLibrary | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase', color: 'var(--text-secondary)',` |
| 123 | `components/Footer.tsx:148` | public | Footer | 대문자 해제 (문장형, 자간 ≤0.02em) | `className="font-black uppercase"` |
| 124 | `components/Footer.tsx:170` | public | Footer | 대문자 해제 (문장형, 자간 ≤0.02em) | `className="font-bold uppercase transition-colors duration-300 hover:text-white"` |
| 125 | `components/Footer.tsx:187` | public | Footer | 대문자 해제 (문장형, 자간 ≤0.02em) | `className="font-black uppercase"` |
| 126 | `components/Footer.tsx:252` | public | Footer | 대문자 해제 (문장형, 자간 ≤0.02em) | `className="font-black uppercase"` |
| 127 | `components/Footer.tsx:259` | public | Footer | 대문자 해제 (문장형, 자간 ≤0.02em) | `className="font-black uppercase"` |
| 128 | `components/InstagramFeed.tsx:161` | public | InstagramFeed | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 5, color: 'var(-` |
| 129 | `components/InstagramFeed.tsx:165` | public | InstagramFeed | 대문자 해제 (문장형, 자간 ≤0.02em) | `<a href={instagramUrl} target="_blank" rel="noopener noreferrer" data-track="instagram_fol` |
| 130 | `components/InstagramFeed.tsx:186` | public | InstagramFeed | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 5, color: 'var(-` |
| 131 | `components/InstagramFeed.tsx:232` | public | InstagramFeed | 대문자 해제 (문장형, 자간 ≤0.02em) | `style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#000', color:` |
| 132 | `components/MagazineShelf.tsx:78` | public | MagazineShelf | 대문자 해제 (문장형, 자간 ≤0.02em) | `{(magazine.month_name ?? '').toUpperCase()} {magazine.year}` |
| 133 | `components/MagazineShelf.tsx:287` | public | MagazineShelf | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 134 | `components/MagazineShelf.tsx:308` | public | MagazineShelf | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 135 | `components/MagazineShelf.tsx:390` | public | MagazineShelf | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 136 | `components/MagazineShelf.tsx:420` | public | MagazineShelf | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 137 | `components/MagazineShelf.tsx:482` | public | MagazineShelf | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase;` |
| 138 | `components/MagazineViewer.tsx:38` | public | MagazineViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ color: '#9C8B7A', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransfo` |
| 139 | `components/MagazineViewer.tsx:75` | public | MagazineViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `.mv-soon-kicker { display: block; font-size: 10px; font-weight: 800; letter-spacing: 0.3em` |
| 140 | `components/MagazineViewer.tsx:300` | public | MagazineViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 4, color: accentColor + '80', tex` |
| 141 | `components/MagazineViewer.tsx:453` | public | MagazineViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase',` |
| 142 | `components/MagazineViewer.tsx:769` | public | MagazineViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `<span style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: 4, color: '#` |
| 143 | `components/MagazineViewer.tsx:818` | public | MagazineViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase', cursor: 'pointer',` |
| 144 | `components/MagazineViewer.tsx:896` | public | MagazineViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ textAlign: 'center', padding: '2px 0 20px', color: '#C4B8AB', fontSize: 9, let` |
| 145 | `components/MagazineViewer.tsx:913` | public | MagazineViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `<span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase',` |
| 146 | `components/MagazineViewer.tsx:925` | public | MagazineViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ fontSize: 8, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', co` |
| 147 | `components/MagazineViewer.tsx:953` | public | MagazineViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `<span style={{ fontSize: 8, color: '#C4B8AB', fontWeight: 700, textTransform: 'uppercase',` |
| 148 | `components/MagazineViewer.tsx:1050` | public | MagazineViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `<span className="mv-label" style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, textT` |
| 149 | `components/MagazineViewer.tsx:1051` | public | MagazineViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `<h2 className="mv-title" style={{ margin: 0, fontSize: 'clamp(28px, 5vw, 48px)', fontWeigh` |
| 150 | `components/MagazineViewer.tsx:1204` | public | MagazineViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ fontSize: 8, fontWeight: 900, letterSpacing: 5, color: 'rgba(139,115,85,0.3)',` |
| 151 | `components/MagazineViewer.tsx:1210` | public | MagazineViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ margin: '0 0 5px', fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransfo` |
| 152 | `components/NewsletterCTA.tsx:95` | public | NewsletterCTA | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 153 | `components/NewsletterCTA.tsx:152` | public | NewsletterCTA | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 154 | `components/NewsletterCTA.tsx:198` | public | NewsletterCTA | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 155 | `components/NewsletterCTA.tsx:327` | public | NewsletterCTA | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 156 | `components/NotFoundContent.tsx:39` | public | NotFoundContent | 대문자 해제 (문장형, 자간 ≤0.02em) | `style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', colo` |
| 157 | `components/NotFoundContent.tsx:53` | public | NotFoundContent | 대문자 해제 (문장형, 자간 ≤0.02em) | `<span style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTran` |
| 158 | `components/PdfViewer.tsx:48` | public | PdfViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ color: '#9C8B7A', fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransfo` |
| 159 | `components/PdfViewer.tsx:60` | public | PdfViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransfo` |
| 160 | `components/PdfViewer.tsx:82` | public | PdfViewer | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransfo` |
| 161 | `components/SearchOverlay.tsx:162` | public | SearchOverlay | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '5px', color` |
| 162 | `components/SearchOverlay.tsx:235` | public | SearchOverlay | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '4px', color` |
| 163 | `components/SearchOverlay.tsx:330` | public | SearchOverlay | 대문자 해제 (문장형, 자간 ≤0.02em) | `fontSize: '9px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase',` |
| 164 | `components/SearchOverlay.tsx:369` | public | SearchOverlay | 대문자 해제 (문장형, 자간 ≤0.02em) | `<p className="font-black uppercase" style={{ fontSize: '10px', letterSpacing: '4px', color` |
| 165 | `components/SearchOverlay.tsx:382` | public | SearchOverlay | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase', color: 'var(--text-secondary)',` |
| 166 | `components/ShareButton.tsx:105` | public | ShareButton | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 167 | `components/ShareButton.tsx:231` | public | ShareButton | 대문자 해제 (문장형, 자간 ≤0.02em) | `textTransform: 'uppercase',` |
| 168 | `components/StoryPressFAQ.tsx:23` | storypress | StoryPressFAQ | 유지 (제품 랜딩 §6.5 — 별도 판단) | `<p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 5, textTransform: 'uppercase', c` |
| 169 | `components/StoryPressPostCard.tsx:30` | storypress | StoryPressPostCard | 유지 (제품 랜딩 §6.5 — 별도 판단) | `<p style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', c` |
| 170 | `components/StoryPressPostCard.tsx:58` | storypress | StoryPressPostCard | 유지 (제품 랜딩 §6.5 — 별도 판단) | `textTransform: 'uppercase',` |
| 171 | `components/TipTapEditor.tsx:447` | admin-editor | TipTapEditor | 범위 밖 (관리자 편집기) | `<p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#94a3b8', textTransfo` |
| 172 | `components/TipTapEditor.tsx:960` | admin-editor | TipTapEditor | 범위 밖 (관리자 편집기) | `<p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#94a3b8', textTransfo` |
| 173 | `components/magazine/ArticlePageRenderer.tsx:137` | magazine | ArticlePageRenderer | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 174 | `components/magazine/CoverPreview.tsx:105` | magazine | CoverPreview | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 175 | `components/magazine/CoverPreview.tsx:213` | magazine | CoverPreview | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 176 | `components/magazine/CoverPreview.tsx:253` | magazine | CoverPreview | 유지 (매거진 지면 예외) | `color: subHex, textTransform: 'uppercase',` |
| 177 | `components/magazine/CoverPreview.tsx:281` | magazine | CoverPreview | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 178 | `components/magazine/MagazineIssueDetail.tsx:17` | public | MagazineIssueDetail | 대문자 해제 (문장형, 자간 ≤0.02em) | `text-transform: uppercase; color: #8A6B4F;` |
| 179 | `components/magazine/MagazineIssueDetail.tsx:71` | public | MagazineIssueDetail | 대문자 해제 (문장형, 자간 ≤0.02em) | `letter-spacing: 0.3em; text-transform: uppercase;` |
| 180 | `components/magazine/MagazineIssueDetail.tsx:140` | public | MagazineIssueDetail | 대문자 해제 (문장형, 자간 ≤0.02em) | `letter-spacing: 0.35em; text-transform: uppercase;` |
| 181 | `components/magazine/MagazineIssueDetail.tsx:186` | public | MagazineIssueDetail | 대문자 해제 (문장형, 자간 ≤0.02em) | `letter-spacing: 0.3em; text-transform: uppercase;` |
| 182 | `components/magazine/MagazinePage.tsx:67` | magazine | MagazinePage | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 183 | `components/magazine/MagazineSpreadViewer.tsx:347` | magazine | MagazineSpreadViewer | 유지 (매거진 지면 예외) | `const issueInfo = 'MHJ · ${(magazine.month_name ?? '').toUpperCase()} ${magazine.year ?? '` |
| 184 | `components/magazine/MagazineSpreadViewer.tsx:494` | magazine | MagazineSpreadViewer | 유지 (매거진 지면 예외) | `textTransform: 'uppercase', color: barText,` |
| 185 | `components/magazine/MagazineSpreadViewer.tsx:569` | magazine | MagazineSpreadViewer | 유지 (매거진 지면 예외) | `color: '#94A3B8', textTransform: 'uppercase', margin: 0,` |
| 186 | `components/magazine/MagazineSpreadViewer.tsx:634` | magazine | MagazineSpreadViewer | 유지 (매거진 지면 예외) | `textTransform: 'uppercase', color: '#94A3B8', marginTop: 2,` |
| 187 | `components/magazine/TocPreview.tsx:52` | magazine | TocPreview | 유지 (매거진 지면 예외) | `color: theme.secondary, textTransform: 'uppercase', marginBottom: '12px',` |
| 188 | `components/magazine/TocPreview.tsx:105` | magazine | TocPreview | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 189 | `components/magazine/TocPreview.tsx:141` | magazine | TocPreview | 유지 (매거진 지면 예외) | `color: '${theme.primary}60', textTransform: 'uppercase',` |
| 190 | `components/magazine/templates/ClassicTemplate.tsx:183` | magazine | ClassicTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 191 | `components/magazine/templates/ColumnLayoutTemplate.tsx:161` | magazine | ColumnLayoutTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 192 | `components/magazine/templates/ColumnLayoutTemplate.tsx:270` | magazine | ColumnLayoutTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 193 | `components/magazine/templates/CoverTemplate.tsx:83` | magazine | CoverTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 194 | `components/magazine/templates/CoverTemplate.tsx:110` | magazine | CoverTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 195 | `components/magazine/templates/CoverTemplate.tsx:159` | magazine | CoverTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 196 | `components/magazine/templates/DirectoryTemplate.tsx:34` | magazine | DirectoryTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 197 | `components/magazine/templates/DirectoryTemplate.tsx:187` | magazine | DirectoryTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 198 | `components/magazine/templates/FeatureHalfTemplate.tsx:144` | magazine | FeatureHalfTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 199 | `components/magazine/templates/LittleNotesTemplate.tsx:123` | magazine | LittleNotesTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 200 | `components/magazine/templates/MiddleTemplate.tsx:144` | magazine | MiddleTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 201 | `components/magazine/templates/MumsNoteTemplate.tsx:122` | magazine | MumsNoteTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 202 | `components/magazine/templates/PhotoEssayTemplate.tsx:101` | magazine | PhotoEssayTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 203 | `components/magazine/templates/PhotoEssayTemplate.tsx:159` | magazine | PhotoEssayTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 204 | `components/magazine/templates/PhotoHeroTemplate.tsx:129` | magazine | PhotoHeroTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 205 | `components/magazine/templates/PhotoHeroTemplate.tsx:186` | magazine | PhotoHeroTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 206 | `components/magazine/templates/SidebarTemplate.tsx:143` | magazine | SidebarTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 207 | `components/magazine/templates/SidebarTemplate.tsx:193` | magazine | SidebarTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 208 | `components/magazine/templates/SpecialTemplate.tsx:150` | magazine | SpecialTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 209 | `components/magazine/templates/SplitTemplate.tsx:122` | magazine | SplitTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 210 | `components/magazine/templates/SplitTemplate.tsx:151` | magazine | SplitTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 211 | `components/magazine/templates/SplitTemplate.tsx:193` | magazine | SplitTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 212 | `components/magazine/templates/Story2Template.tsx:119` | magazine | Story2Template | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 213 | `components/magazine/templates/Story2Template.tsx:161` | magazine | Story2Template | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 214 | `components/magazine/templates/TextOnlyTemplate.tsx:95` | magazine | TextOnlyTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 215 | `components/magazine/templates/TextOnlyTemplate.tsx:147` | magazine | TextOnlyTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 216 | `components/magazine/templates/TitleCardTemplate.tsx:34` | magazine | TitleCardTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |
| 217 | `components/magazine/templates/TitleCardTemplate.tsx:94` | magazine | TitleCardTemplate | 유지 (매거진 지면 예외) | `textTransform: 'uppercase',` |

## D. 가운뎃점 (`·`) — 79행 (grep 79건 · 관리자 폴더 70건은 범위 밖이라 제외)

```bash
/usr/bin/grep -rnEi --include=*.ts --include=*.tsx --include=*.css \
  -e '·' app components \
  | grep -vE '^(app/mhj-desk/|components/admin/)' \
  | grep -vE ':[0-9]+:[[:space:]]*(//|/\*|\*|\{/\*)' | wc -l
```

| # | 파일:줄 | 영역 | 용도 | 제안 (시안 B) | 줄 내용 |
|---:|---|---|---|---|---|
| 1 | `app/(public)/blog/[slug]/page.tsx:322` | public | blog/[slug]/page | 주석 안 (변경 대상 아님) | `Journal 링크가 되돌아가기를 겸하고, Home·카테고리까지 한 줄로 보여준다.` |
| 2 | `app/(public)/blog/[slug]/page.tsx:501` | public | blog/[slug]/page | 주석 안 (변경 대상 아님) | `(몇 살에 입학하나 · consolidating 이 무슨 뜻인가 · 몇 학년이 배우나),` |
| 3 | `app/(public)/blog/[slug]/page.tsx:615` | public | blog/[slug]/page | 주석 안 (변경 대상 아님) | `marginTop 48 — 요약·FAQ·저자 박스와 같은 호흡(위 여백 48 → 선 → 안쪽 여백). 이게 없으면 FAQ·태그가 없는 글에서` |
| 4 | `app/(public)/blog/tag/[tag]/page.tsx:126` | public | tag/[tag]/page | 쉼표 또는 줄바꿈·간격으로 대체 | `{blog.category} · {blog.date}` |
| 5 | `app/(public)/gallery/GalleryClient.tsx:185` | public | GalleryClient | 쉼표 또는 줄바꿈·간격으로 대체 | `{current.source} · {current.category}{current.date ? ' · ${formatDate(current.date)}' : ''` |
| 6 | `app/(public)/magazine/[id]/page.tsx:219` | public | magazine/[id]/page | 주석 안 (변경 대상 아님) | `템플릿·PNG 파이프라인(app/internal/render)은 원본을 그대로 쓴다 — 여기서만 바꾼다.` |
| 7 | `app/(public)/magazine/[id]/page.tsx:220` | public | magazine/[id]/page | 주석 안 (변경 대상 아님) | `쪽 수 계산(buildPageMap)·JSON-LD 는 원본 articles 로 한다(이미지 개수·이름만 쓰므로 결과는 같다). */` |
| 8 | `app/(public)/page.tsx:306` | public | app/(public)/page | 주석 안 (변경 대상 아님) | `히어로 글 제목이 H1 이면 홈의 주제가 매주 바뀐다(자체진단 H17·heading-order). 히어로가 비어도 남도록` |
| 9 | `app/(public)/page.tsx:307` | public | app/(public)/page | 주석 안 (변경 대상 아님) | `조건 밖에 둔다. 스타일은 홈 라벨 관례(12px·900·자간 2·대문자·text-secondary). */}` |
| 10 | `app/(public)/page.tsx:672` | public | app/(public)/page | 쉼표 또는 줄바꿈·간격으로 대체 | `{latestMag.issue_number ? ' · Issue ${String(latestMag.issue_number).padStart(2, '0')}' : ` |
| 11 | `app/(public)/page.tsx:766` | public | app/(public)/page | 쉼표 또는 줄바꿈·간격으로 대체 | `{main.date && ' · ${formatDate(main.date)}'}` |
| 12 | `app/(public)/page.tsx:801` | public | app/(public)/page | 쉼표 또는 줄바꿈·간격으로 대체 | `{mainComments > 0 && ' · ${mainComments} ${mainComments === 1 ? 'Comment' : 'Comments'}'}` |
| 13 | `app/(public)/page.tsx:802` | public | app/(public)/page | 쉼표 또는 줄바꿈·간격으로 대체 | `{' · '}` |
| 14 | `app/(public)/page.tsx:946` | public | app/(public)/page | 주석 안 (변경 대상 아님) | `minHeight: '2.8em', /* 2줄 고정 — 1·2줄 제목 혼재 시 하단 태그/조회수 정렬 유지 */` |
| 15 | `app/(public)/page.tsx:968` | public | app/(public)/page | 쉼표 또는 줄바꿈·간격으로 대체 | `{blog.tags.slice(0, 2).join(' · ')}` |
| 16 | `app/(public)/page.tsx:979` | public | app/(public)/page | 쉼표 또는 줄바꿈·간격으로 대체 | `{(blog.view_count ?? 0) > 0 && ' · ${blog.view_count} ${blog.view_count === 1 ? 'view' : '` |
| 17 | `app/(public)/page.tsx:980` | public | app/(public)/page | 쉼표 또는 줄바꿈·간격으로 대체 | `{commentCount > 0 && ' · ${commentCount} ${commentCount === 1 ? 'Comment' : 'Comments'}'}` |
| 18 | `app/(public)/storypress/StoryPressClient.tsx:208` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `Free to try · No credit card needed` |
| 19 | `app/(public)/storypress/StoryPressClient.tsx:561` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `{book.pages} pages · {book.month}` |
| 20 | `app/(public)/storypress/StoryPressClient.tsx:652` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `Based on Dolch &amp; Fry word lists · Nation&apos;s vocabulary framework · Biemiller&apos;` |
| 21 | `app/(public)/storypress/StoryPressClient.tsx:843` | storypress | StoryPressClient | 유지 (제품 랜딩 §6.5 — 별도 판단) | `Free to try · Cancel anytime` |
| 22 | `app/api/ai-seo/route.ts:51` | nonscreen | api/ai-seo/route | 화면 밖 텍스트 (메타·메일·robots 등) — 별도 판단 | `- 과장·낚시 금지, 글에 없는 내용 금지` |
| 23 | `app/api/ai-seo/route.ts:67` | nonscreen | api/ai-seo/route | 화면 밖 텍스트 (메타·메일·robots 등) — 별도 판단 | `- 원문에 있는 내용만. 없는 사실·숫자·날짜를 지어내지 마` |
| 24 | `app/api/ai-seo/route.ts:69` | nonscreen | api/ai-seo/route | 화면 밖 텍스트 (메타·메일·robots 등) — 별도 판단 | `- 아이는 **Min / Hyun / Jin 으로만** 부른다. 본문에 다른 표기(한국식 실명·로마자 실명)가 있어도 그 표기를 절대 쓰지 말고 Min/Hyun/` |
| 25 | `app/api/send-newsletter/route.ts:208` | nonscreen | api/send-newsletter/route | 화면 밖 텍스트 (메타·메일·robots 등) — 별도 판단 | `{ error: '발송 전 점검에서 막혔습니다:\n· ${issues.join('\n· ')}', presend_issues: issues },` |
| 26 | `app/globals.css:9` | public | globals.css | 주석 안 (변경 대상 아님) | `Noto 400/500/700/900 매 페이지, Playfair 400·400i·700·700i·900. 줄이려면 디자인 변경이 필요하다(next/font 이전` |
| 27 | `app/globals.css:69` | public | 토큰 `--newsletter-field-border` | 주석 안 (변경 대상 아님) | `--newsletter-field-border: rgba(255,255,255,0.5);   /* 안쪽 3.89:1 · 바깥 4.95:1 */` |
| 28 | `app/globals.css:133` | public | 토큰 `--newsletter-field-border` (다크) | 주석 안 (변경 대상 아님) | `--newsletter-field-border: rgba(0,0,0,0.55);        /* 안쪽 4.39:1 · 바깥 4.69:1 */` |
| 29 | `app/globals.css:146` | public | `.dark` | 주석 안 (변경 대상 아님) | `정체성(주황·코랄·인디고·초록)은 그대로 두고 **값만** 실측 AA 로 맞춘 짝을 둔다.` |
| 30 | `app/globals.css:149` | storypress | `.dark` | 주석 안 (변경 대상 아님) | `1) '--sp-*'         테마를 따라 뒤집히는 면: '--bg' · '--bg-surface' · '--bg-card' ·` |
| 31 | `app/globals.css:151` | storypress | `.dark` | 주석 안 (변경 대상 아님) | `2) '--sp-onlight-*' 테마와 무관하게 **밝게 남는** 면: 샘플 책 파스텔 · Science of Reading` |
| 32 | `app/globals.css:152` | public | `.dark` | 주석 안 (변경 대상 아님) | `배지 · Our Story 크림 그라디언트와 흰 카드 · 재생 버튼 흰 원` |
| 33 | `app/globals.css:154` | public | `.dark` | 주석 안 (변경 대상 아님) | `2·3 은 '.dark' 에서 덮어쓰지 않는다 — 배경이 안 뒤집히는데 글자만 뒤집으면 사라진다` |
| 34 | `app/globals.css:158` | public | `.dark` | 주석 안 (변경 대상 아님) | `그중 최악값이다. 라이트 최악은 대개 '#EEF2FF'(배지·인디고 파스텔)와 '#FFE8EE'(단어 카드` |
| 35 | `app/globals.css:169` | storypress | 토큰 `--sp-body` | 주석 안 (변경 대상 아님) | `--sp-body:       #5A6779;   /* 본문 보조·섹션 eyebrow·메타 — 최악 4.94:1 */` |
| 36 | `app/globals.css:182` | public | `:root` | 주석 안 (변경 대상 아님) | `0.2 → 1.77:1 · 0.25 → 2.14:1 · 0.45 → 4.50:1 이었다. */` |
| 37 | `app/globals.css:189` | public | `.dark` | 주석 안 (변경 대상 아님) | `('#F59E42' 7.82:1 · '#FF8B5E' 7.23:1 · '#10B981' 6.57:1, 최악 '#1E1E1E' 기준) */` |
| 38 | `app/globals.css:909` | public | `.blog-content p` | 주석 안 (변경 대상 아님) | `리드 글꼴·드롭캡을 또 받지 않게 여섯 규칙 모두에서 뺀다(2026-09-11 W6-C). */` |
| 39 | `app/globals.css:1116` | public | `.blog-content .blog-video iframe` | 주석 안 (변경 대상 아님) | `W4-B 글 페이지 블록 — 빵부스러기·목차·Key takeaways·한국어 요약·FAQ` |
| 40 | `app/globals.css:1250` | public | `.blog-faq dd` | 주석 안 (변경 대상 아님) | `끊어(위 '인포블록 CSS 격리') 목록·표가 본문 값을 못 받고 있었다(플랜 W4-B). */` |
| 41 | `app/globals.css:1255` | public | `.blog-info-block li:not([style])` | 주석 안 (변경 대상 아님) | `'<table style="text-align:center">' 의 상속을 이기고(실측 2026-09-09: 7편·200셀 중 text-align 인라인은 25셀` |
| 42 | `app/globals.css:1256` | public | `.blog-info-block li:not([style])` | 주석 안 (변경 대상 아님) | `기존 표가 전부 왼쪽 정렬·행 높이 증가로 바뀐다. */` |
| 43 | `app/internal/render/article/[id]/page.tsx:37` | magazine | article/[id]/page | 유지 (매거진 지면 예외) | `issueInfo={'MHJ · ${article.date ?? ''}'}` |
| 44 | `app/layout.tsx:106` | nonscreen | app/layout | 주석 안 (변경 대상 아님) | `참고: 2026-10-18 지연 시험(sonner 만 늦춤 22/100 · 대조 0/100)에서 매거진 #418 이 늘었지만, 원인은 sonner 의` |
| 45 | `app/llms-full.txt/route.ts:216` | nonscreen | app/llms-full.txt/route | 화면 밖 텍스트 (메타·메일·robots 등) — 별도 판단 | `'Source: ${SITE_URL}/blog/${b.slug} · ${b.category} · ${formatDate(b.updated_at ?? b.creat` |
| 46 | `app/robots.ts:60` | nonscreen | robots | 주석 안 (변경 대상 아님) | `'Diffbot',         // 다수 검색·요약 도구` |
| 47 | `components/BlogLibrary.tsx:77` | public | BlogLibrary | 쉼표 또는 줄바꿈·간격으로 대체 | `{activeCategory ? 'Journal · ${activeCategory}' : 'Journal'}` |
| 48 | `components/BlogLibrary.tsx:563` | public | BlogLibrary | 쉼표 또는 줄바꿈·간격으로 대체 | `{blog.is_sponsored && <span style={{ marginLeft: 6 }}>· AD</span>}` |
| 49 | `components/BlogLibrary.tsx:576` | public | BlogLibrary | 주석 안 (변경 대상 아님) | `minHeight: '2.8em', /* 2줄 고정 — 1·2줄 제목 혼재 시 하단 태그/조회수 정렬 유지 */` |
| 50 | `components/BlogLibrary.tsx:595` | public | BlogLibrary | 쉼표 또는 줄바꿈·간격으로 대체 | `{blog.tags.slice(0, 2).join(' · ')}` |
| 51 | `components/MagazineViewer.tsx:60` | public | MagazineViewer | 주석 안 (변경 대상 아님) | `→ 그 호의 실제 표지 + 편집실의 양해 글 + 다른 읽을거리·완성 알림. 색은 테마 변수만 써서` |
| 52 | `components/MagazineViewer.tsx:96` | public | MagazineViewer | 쉼표 또는 줄바꿈·간격으로 대체 | `<span className="mv-soon-kicker">In Preparation · {magazine.month_name} {magazine.year}</s` |
| 53 | `components/MagazineViewer.tsx:300` | public | MagazineViewer | 쉼표 또는 줄바꿈·간격으로 대체 | `<p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 4, color: accentColor + '80', tex` |
| 54 | `components/MagazineViewer.tsx:770` | public | MagazineViewer | 쉼표 또는 줄바꿈·간격으로 대체 | `{magazine.year} · {magazine.month_name}` |
| 55 | `components/MagazineViewer.tsx:897` | public | MagazineViewer | 쉼표 또는 줄바꿈·간격으로 대체 | `← → 키보드 · 스와이프` |
| 56 | `components/MagazineViewer.tsx:914` | public | MagazineViewer | 쉼표 또는 줄바꿈·간격으로 대체 | `{magazine.year} · {magazine.month_name}` |
| 57 | `components/MagazineViewer.tsx:1018` | public | MagazineViewer | 쉼표 또는 줄바꿈·간격으로 대체 | `<span style={{ color: '#C4B8AB', marginLeft: 4 }}>· {pgCount}p</span>` |
| 58 | `components/MagazineViewer.tsx:1055` | public | MagazineViewer | 쉼표 또는 줄바꿈·간격으로 대체 | `{magazine.year} {magazine.month_name} · Editor: {magazine.editor} · {sortedArticles.length` |
| 59 | `components/MagazineViewer.tsx:1211` | public | MagazineViewer | 쉼표 또는 줄바꿈·간격으로 대체 | `{article.author} · {article.date}` |
| 60 | `components/SearchOverlay.tsx:208` | public | SearchOverlay | 주석 안 (변경 대상 아님) | `다시 시도·타이핑마다 카테고리 링크 목록까지 통째로 다시 읽혔다. */}` |
| 61 | `components/SearchOverlay.tsx:326` | public | SearchOverlay | 주석 안 (변경 대상 아님) | `하드코딩 인디고·분홍·초록을 9% 배경에 얹어 양 테마 모두 대비 미달이었다(라이트 초록 2.31:1 · 다크 인디고 2.48:1). */}` |
| 62 | `components/StoryPressFAQ.tsx:102` | storypress | StoryPressFAQ | 주석 안 (변경 대상 아님) | `aria-expanded·aria-controls 로 이미 전달된다 — 랜드마크일 필요가 없다. */}` |
| 63 | `components/StoryPressPostCard.tsx:31` | storypress | StoryPressPostCard | 유지 (제품 랜딩 §6.5 — 별도 판단) | `From our family · StoryPress` |
| 64 | `components/magazine/CoverPreview.tsx:243` | magazine | CoverPreview | 유지 (매거진 지면 예외) | `if (i < arr.length - 1) acc.push(<span key={'sep-${i}'} style={{ fontSize: '10px', color: ` |
| 65 | `components/magazine/CoverPreview.tsx:283` | magazine | CoverPreview | 유지 (매거진 지면 예외) | `Mairangi Bay · Auckland · New Zealand` |
| 66 | `components/magazine/MagazineCanvas.tsx:10` | magazine | MagazineCanvas | 주석 안 (변경 대상 아님) | `→ 어떤 창 크기/줌에서도 지면 내부 레이아웃·분량이 픽셀 단위로 동일.` |
| 67 | `components/magazine/MagazineIssueDetail.tsx:272` | public | MagazineIssueDetail | 쉼표 또는 줄바꿈·간격으로 대체 | `{magazine.month_name} {magazine.year} · Issue` |
| 68 | `components/magazine/MagazineIssueDetail.tsx:275` | public | MagazineIssueDetail | 쉼표 또는 줄바꿈·간격으로 대체 | `<p className="mid-sub">Mairangi Bay · Auckland · New Zealand</p>` |
| 69 | `components/magazine/MagazineIssueDetail.tsx:281` | public | MagazineIssueDetail | 쉼표 또는 줄바꿈·간격으로 대체 | `<span className="mid-editor">Editor · {magazine.editor}</span>` |
| 70 | `components/magazine/MagazineIssueDetail.tsx:302` | public | MagazineIssueDetail | 주석 안 (변경 대상 아님) | `썸네일(.mid-thumb)은 지면을 통째로 축소 렌더한 것이라 템플릿의 <h1>·본문 전문·표지 캐러셀 점` |
| 71 | `components/magazine/MagazineIssueDetail.tsx:304` | public | MagazineIssueDetail | 주석 안 (변경 대상 아님) | `깨진다(axe heading-order, 2026-09-11). inert 로 보조기기·Tab 에서 빼고, 클릭은 감싼 링크가 받는다. */}` |
| 72 | `components/magazine/MagazineSpreadViewer.tsx:108` | magazine | MagazineSpreadViewer | 주석 안 (변경 대상 아님) | `→ 창 크기/줌과 무관하게 지면 내부 레이아웃·분량이 항상 동일.` |
| 73 | `components/magazine/MagazineSpreadViewer.tsx:347` | magazine | MagazineSpreadViewer | 유지 (매거진 지면 예외) | `const issueInfo = 'MHJ · ${(magazine.month_name ?? '').toUpperCase()} ${magazine.year ?? '` |
| 74 | `components/magazine/TocPreview.tsx:64` | magazine | TocPreview | 유지 (매거진 지면 예외) | `{title} · {month_name} {year}` |
| 75 | `components/magazine/templates/ColumnLayoutTemplate.tsx:19` | magazine | ColumnLayoutTemplate | 주석 안 (변경 대상 아님) | `영업시간·준비물 같은 실용 정보는 산문이 아니다. 본문 흐름에 두면 지면 분량만` |
| 76 | `components/magazine/templates/shared.ts:80` | magazine | shared | 주석 안 (변경 대상 아님) | `(2026-10-19 라이브 A/B: 이 방식 0/2,000 · useId 운영 4/1,999. 하이드레이션 중 useId 가 왜 달라지는지는 미확인).` |
| 77 | `components/magazine/templates/shared.ts:161` | magazine | shared | 유지 (매거진 지면 예외) | `const [title, ...restParts] = text.split(/[—–\-:·]\s+/);` |
| 78 | `components/magazine/templates/shared.ts:174` | magazine | shared | 유지 (매거진 지면 예외) | `const [title, ...rest] = text.split(/[—–\-:·]\s+/);` |
| 79 | `components/magazine/useCanvasScale.ts:47` | magazine | useCanvasScale | 주석 안 (변경 대상 아님) | `const [scale, setScale] = useState(1); // 초기값 1 (두 엔진 현재값·SSR 첫 페인트 일치)` |
