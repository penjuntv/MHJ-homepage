# 제목·메타 설명 틀 모음 (MHJ)

`SKILL.md` §4 의 보충이다. 틀은 출발점일 뿐이다. 칸은 **본문에 있는 사실**로만 채우고, 다 채운 뒤 `SKILL.md` §7 AI 티 점검을 한 번 더 돌린다.

예시 문구는 전부 **예시**다. 실제 글 제목이나 실측 결과가 아니다(실제 기록은 `docs/measurements/gsc-2026-09-23.md` §7·§8·§10).

---

## 1. 검색어 유형별 대응

GSC 페이지별 검색어를 보면 MHJ 로 오는 검색은 거의 전부 **사실 하나를 묻는다**(`docs/CONTENT-SEARCH-STANDARD-2026-09-24.md` §1). 그 사실의 **모양**에 제목을 맞춘다.

| 검색어 모양 | 검색어 (GSC 실측, 예시 표시 제외) | 제목이 예고할 것 | 설명 첫 문장에 둘 것 |
|---|---|---|---|
| 뜻 묻기 | `what does consolidating mean in school report` | 단어 + "what it means" | 그 단어의 뜻 한 문장 |
| 나이·학년 | `what age do children start school in new zealand` | "What Age", "Which Year" | 나이·학년 조건 |
| 누가 배우나 | `keeping ourselves safe junior primary` | 프로그램 이름 + "what it teaches" | 학년 구간 |
| 제도 변화 | (예시) `ncea changes` | 제도 이름 + 무엇이 언제 바뀌나 | 바뀌는 것 하나와 시점(근거 있을 때만) |
| 어떻게 하나 | (예시) `what to pack school lunch nz` | "How to ..." / "What to Pack ..." | 첫 단계 또는 핵심 한 가지 |
| 시간·운영 | `albany library opening hours` | **쓰지 않는다** — 글에 답이 없으면 제목으로 못 고친다 | — |

마지막 줄이 중요하다. 의도가 어긋나면 손대지 않고 "의도 불일치"로 기록만 한다.

## 2. 영어 제목 틀 (30~60자)

| 틀 | 예시 |
|---|---|
| `{제도/주제}: What {질문 핵심}?` | Starting School in New Zealand: What Age and Which Year? |
| `{용어} on a NZ School Report: What It Means` | (예시) "Consolidating" on a NZ School Report: What It Means |
| `{주제}: What This NZ {대상} {동사}` | Keeping Ourselves Safe: What This NZ School Programme Teaches |
| `{주제}: A Korean Family's / Migrant Parent's View` | NCEA Changes: A Migrant Parent's View of the NZ Shake-Up |
| `What to {행동} for {학년/상황} at a NZ School` | (예시) What to Pack for Year 1 at a NZ School |
| `{장소 이름}, {지역}: {경험 한 줄}` | A Fishing Day at Ruakākā Beach, Northland |

- 지명(Mairangi Bay · North Shore · Auckland)은 검색어에 들어 있거나 글의 핵심일 때만 넣는다. 매번 넣으면 길이만 먹는다.
- 콜론(:)으로 "주제 / 각도"를 나누는 것은 괜찮다. em dash 는 새 문구에 쓰지 않는다.
- 제목 안에 아이 이름(Min/Hyun/Jin 포함)을 넣지 않는다(gsc §8 규칙 ④).

## 3. 메타 설명 틀 (120~160자, 2문장)

```
{질문의 답 한 문장 — 숫자·나이·조건}. {우리만의 것 한 문장 — 직접 겪은 일 / 한국 가족의 시선 / 지역}.
```

- 첫 문장은 검색자가 **누르지 않아도** 답을 얻을 만큼 분명하게 쓴다. 그래도 눌리게 하는 것은 둘째 문장이다 — 정부 사이트에 없는 "우리 집에서는 이랬다".
- "In this post, we explore..." 로 시작하지 않는다. 글이 무엇을 하는지가 아니라 **무엇을 알려 주는지** 쓴다.
- 본문에 없는 약속("everything", "complete guide")을 하지 않는다.

## 4. 한국어 문구 틀 (요약 블록 · 네이버 원고 · 뉴스레터)

| 자리 | 틀 | 예시 |
|---|---|---|
| 제목 | `{제도/주제} {질문 핵심}, {우리 각도}` | 뉴질랜드 초등학교 입학 나이와 학년, 한국 가족이 겪어 보니 |
| 첫 문장 | 답을 평서문으로 | 뉴질랜드 아이들은 다섯 번째 생일 이후 학교에 갑니다. |
| 둘째 문장 | 이 글에만 있는 것 | 마이랑이 베이에서 첫 학기를 보내며 알게 된 것을 함께 적었습니다. |

- 한국 독자가 실제로 쓰는 말을 쓴다: "성적표", "입학 나이", "학년 배정". 영어 제도 이름(Year 0, NCEA, ERO)은 그대로 두고 처음 한 번만 풀이한다.
- `summary_ko` 는 두 분 목소리가 아니면 비워 둔다 — 빈 칸이 어색한 요약보다 낫다(`docs/SEO_OPS_LOOP.md` §2 보강 절차 2).

## 5. "이 글을 읽으면" 시험

후보 제목 앞에 **"이 글을 읽으면 ~를 알 수 있다"** 를 붙여 본다(원본의 "Now you can" 시험).

| 후보 | 붙여 보면 | 판정 |
|---|---|---|
| Guide for Newcomer Families | 이 글을 읽으면 … 새로 온 가족을 위한 안내를 알 수 있다 | 탈락 — 무엇을 아는지 안 보인다 |
| What Age and Which Year? | 이 글을 읽으면 몇 살에 몇 학년으로 가는지 알 수 있다 | 통과 — 구체적이고 참 |
| Our Lunchbox Diaries | 이 글을 읽으면 … 도시락 일기를 알 수 있다 | 탈락 — 질문에 답하지 않는다 |

통과하려면 **구체적이고, 참이어야** 한다. 둘 중 하나라도 아니면 다시 쓴다.

## 6. 같은 글, 두 독자

같은 문구도 독자에 따라 다르게 들린다.

| 문구 | 막 도착한 한국 부모 | NZ 현지 부모 |
|---|---|---|
| "A Korean family's view" | 나와 같은 처지 — 신뢰 | 관점 하나 — 중립 |
| "Complete guide to NZ schools" | 기대 — 그런데 본문이 경험담이면 실망 | 정부 사이트가 낫다고 느낌 |

그래서 MHJ 제목은 "완벽한 안내서"를 약속하지 않고, **사실 하나 + 우리 시선 하나**를 약속한다.

## 7. 넘기기 전 점검 (10개)

1. 검색어(또는 그 핵심어)가 제목 앞쪽에 있나
2. 제목이 답의 모양(나이·뜻·학년·방법)을 예고하나
3. 그 답이 본문·FAQ 에 실제로 있나 — 위치를 적었나
4. 설명 첫 문장이 답인가
5. 둘째 문장이 MHJ 만 쓸 수 있는 것인가(바꿔치기 시험)
6. 길이: 영어 제목 30~60 · 설명 120~160 (한국어는 근사치, 실측 없음)
7. 내부 표기(`[Edu]` 등)·em dash·느낌표·낚시 문구 0
8. 지어낸 숫자·최상급 0 — 빈 곳은 `[NEED: ...]`
9. 실명 0 — 제목에는 Min/Hyun/Jin 도 없음
10. 이 글의 이번 변경은 한 곳만인가 — 베이스라인(날짜·노출·클릭·순위)을 남겼나
