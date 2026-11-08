# 초안 — 성적표 글 학년 말 확장 (`how-to-read-a-mid-year-report`, id 103)

작성 2026-11-08 · 근거: 위원회 판결 `docs/decisions/council-2026-11-08-reader-growth.md` · 콘텐츠 브리프 `docs/CONTENT-BRIEF-2026-Q4.md` 파도 1
**발행 마감 제안: 11월 20일**(학년 말 성적표가 오기 전).
**상태(2026-11-08): §2-1·2-2·2-4·3·4·5 와 캡션 중복 삭제는 PeNnY 승인("먼저 반영")으로 DB 반영·라이브 확인 완료.** 본문에선 선생님 질문 절이 지금 **6)** 이다 — 유씨 문단(§2-3)이 오면 "6) What we noticed on ours" 로 끼우고 질문 절을 7) 로 바꾼다. 백업 `qa-reports/report-expand-backup-2026-11-08T10-54-23-646Z.json`. 라이브: 직답·5)·6) 보임, 캡션 1회, FAQPage 7문항, 실명 0, 3화면 오류·가로 넘침 0, llms-full 한국어 요약 반영.

---

## 0. 한눈에 — 무엇이 바뀌나

| 자리 | 지금 | 바꿀 것 |
|---|---|---|
| 글 맨 앞 | 이야기로 바로 시작 | **직답 2문장**을 먼저(검색으로 온 부모가 바로 답을 봄) |
| 본문 | 중간 성적표 4개 절 | 그대로 두고 **5) 학년 말 성적표** · **6) 우리 집 이야기(유씨 몫)** · **7) 선생님께 물어볼 5가지** 추가 |
| 화면 제목 | [Edu] How To Read a Mid-year Report | [Edu] How To Read a School Report: Mid-year and End-of-year |
| 검색 제목(seo_title) | What "Consolidating" Means on a NZ Mid-Year Report | What "Consolidating" Means on a NZ School Report (48자) |
| 검색 설명 | Emerging, Developing, … how to read the rest of it. | 아래 §4 (145자) |
| FAQ | 5개 | 2개 고침 + 2개 추가 = 7개 |
| 한국어 요약 | 중간 성적표만 | 학년 말 두 문장 추가 |
| 주소(slug) | 그대로 | **바꾸지 않음**(쌓인 검색 순위 유지) |

**덧붙여 고칠 결함 1건**: 출석 사진 캡션 "Two days unwell, one with family." 이 캡션 아래 문단으로 한 번 더 나온다 → 뒤의 문단 삭제.

---

## 1. 사실 확인 (2026-11-08, 교육부 공식 페이지)

출처: education.govt.nz — *Guide to your child's reporting and progress* (글의 인포블록이 이미 링크하는 페이지)

| 내용 | 확인 | 초안에 쓰는 법 |
|---|---|---|
| 학교는 1년에 **최소 두 번** 서면 보고 | ✅ PASS | "at least twice a year" |
| 다섯 단계 Emerging · Developing · Consolidating · Proficient · Exceeding, 읽기·쓰기·수학, Years 0–10 | ✅ PASS | 그대로 |
| **중간**: Consolidating 이상 = on track / **학년 말**: Proficient 이상 = met, **Consolidating 은 "has not met"** | ✅ PASS | 학년 말 절의 핵심 문장 |
| **의무화 날짜: 2027-01-01** ("From 1 January 2027, schools will have to include…") | ✅ PASS · ⚠️ 브리프의 "2026년부터 전국 표준화"는 **틀림** | "From 2027 every school must… some already use them" 로 고침 |
| 부모는 성적표 뒤의 평가 결과를 볼 수 있다 | ✅ PASS | 질문 4번 |
| 학년 말 성적표가 나오는 정확한 시기 | ❌ 공식 날짜 없음 | "near the end of the year — check your school's newsletter" 로만 |
| 기존 본문 "Across 2026, schools are paying closer attention to attendance" | ⬜ 이번에 확인 안 함 | 손대지 않음 |

---

## 2. 본문 초안 (영어, 글의 목소리 그대로)

### 2-1. 글 맨 앞에 넣을 직답 — 첫 문단 **앞**

> **In short:** On a New Zealand school report, *Consolidating* means the skill has been taught and your child is practising it until it holds. At mid-year that counts as on track; on an end-of-year report it means the year's expectation hasn't quite been met yet — and *Proficient* or *Exceeding* means it has.

### 2-2. 새 절 5) — 4) 출석 절 **뒤**

> ### 5) The end-of-year report: same words, a different question
>
> Schools report to families at least twice a year, and the end-of-year report uses the same five words as the mid-year one — **Emerging, Developing, Consolidating, Proficient, Exceeding**. From 2027 every school will have to use them for reading, writing and maths in Years 0–10, and some schools already do. What changes between June and December isn't the vocabulary. It's the question each word is answering.
>
> At mid-year, the question is *is this child on track?* Consolidating, Proficient and Exceeding all say yes. At the end of the year, the question becomes *has this child met the expectation for the year?* — and only **Proficient** and **Exceeding** say yes. So the same *Consolidating* that read as reassuring in June reads as *not yet* in December.
>
> That *not yet* is worth reading calmly. It isn't a fail. It says the skill is still settling, and it tells next year's teacher exactly where to pick up. If you see it on your child's report, it's a reason to ask what the next step looks like — not a verdict.
>
> The rest of the report keeps its shape: the *has completed / learning to* lists, the General Comment, the attendance row. At the end of the year, the *learning to* list quietly turns into a starting point for the next one. That makes it the most useful part to keep somewhere safe over the summer.

### 2-3. 새 절 6) — 우리 집 이야기 · **유씨가 쓸 자리** (한 문단, 4~6문장)

> ### 6) What we noticed on ours
>
> *(Yussi 작성 — 아래 질문 중 두세 개에만 답해 주시면 Claude 가 문장을 다듬습니다. 아이 이름은 Min/Hyun/Jin 만, 학교명·선생님 이름은 쓰지 않기.)*

유씨께 드리는 질문(답은 한국어로 짧게 주셔도 됩니다):
1. 학년 말 성적표를 처음 받았을 때 가장 먼저 눈이 간 곳은 어디였나요?
2. 중간 때와 학년 말 사이에 단어가 바뀐 과목이 있었나요? 그걸 보고 어떤 생각이 들었나요?
3. 담임 선생님과 성적표를 두고 나눈 대화 중 기억나는 한마디가 있나요?
4. 한국식 성적표(등수·점수)에 익숙한 부모로서, 처음엔 어떻게 읽었고 지금은 어떻게 읽나요?
5. 여름방학 동안 *learning to* 목록을 실제로 어떻게 썼나요(또는 쓸 생각인가요)?

> ⏱ 유씨 몫은 이 한 문단뿐입니다. 나머지(직답·5절·7절·FAQ·검색 설정)는 Claude 가 이미 썼습니다.

### 2-4. 새 절 7) — 선생님께 물어볼 5가지 · 6) **뒤**

> ### 7) Five questions to take to the teacher
>
> A report is a starting point for a conversation, not the end of one. These are the questions we've found most useful — at the end-of-year interview, or in a short email if there isn't one.
>
> 1. **Where would you put them on the five descriptors in each area — and what would move them one step?**
> 2. **What's on the *learning to* list that we could gently keep going over the summer?**
> 3. **Is there anything you see at school that we might not see at home?** (Quiet children especially.)
> 4. **Could we see the assessment results behind the report?** The Ministry says families should be able to see them if they want to; schools can share them with the report, at an interview or through the school portal.
> 5. **What will help them start well next year?** A new class, a new teacher, sometimes a new school — it's worth asking what will be passed on.
>
> If something on the report doesn't make sense, the Ministry's own advice is the same as ours: ask the school first.

---

## 3. FAQ (faq_json) — 고침 2 · 추가 2

**고침 — Q1** What does "Consolidating" mean on a New Zealand school report?
A. It means the skill has been taught and your child is practising it until it holds — not that they are stuck, and not a C grade. On a mid-year report, Consolidating counts as on track. On an end-of-year report it means the year's expectation hasn't been met yet; Proficient or Exceeding means it has.

**고침 — Q3** What do the five progress descriptors mean on a school report?
A. Emerging, Developing, Consolidating, Proficient and Exceeding describe progress against one child's own year level in reading, writing and maths. At mid-year, Consolidating and above means on track; at the end of the year, Proficient and above means the expectation has been met. From 2027 every school in Years 0–10 must use these words.

**추가 — Q6** Does "Consolidating" on an end-of-year report mean my child failed?
A. No. It means the year's expectation hasn't quite been met yet — the skill is still settling, and it tells next year's teacher where to pick up. It's a good moment to ask the teacher what the next step looks like.

**추가 — Q7** How often do New Zealand schools send reports home?
A. At least twice a year, in writing — usually once around the middle of the year and once near the end. Your school's newsletter will give the exact dates.

(Q2 towards/at/above · Q4 반일 출석 · Q5 justified/unjustified 는 그대로)

---

## 4. 검색 설정

- **화면 제목**: `[Edu] How To Read a School Report: Mid-year and End-of-year`
- **seo_title (48자)**: `What "Consolidating" Means on a NZ School Report` — 순위 잡힌 기존 문구("What 'Consolidating' Means on a NZ")를 앞에 그대로 두고 "Mid-Year" 만 뺀다.
- **meta_description (145자)**: `Emerging to Exceeding: what each level means on a New Zealand school report, at mid-year and at year end, plus five questions to ask the teacher.`
- **태그 추가**: `endofyearreport` · `parentteacherinterview`
- **slug**: 그대로(`how-to-read-a-mid-year-report`).

## 5. 한국어 요약(summary_ko) — 끝에 두 문장 추가

> 학년 말 성적표도 같은 다섯 단어를 쓰지만 묻는 질문이 다르다. 중간에는 Consolidating이 '제 궤도'라는 뜻이지만, 학년 말에는 '아직 그 학년 기대 수준에 닿지 않았다'는 뜻이고 Proficient 이상이어야 '도달'이다. 낙제가 아니라 다음 학년 선생님이 이어받을 출발점이며, 글 끝에 담임에게 물어볼 다섯 가지 질문을 붙였다.

---

## 6. 반영 순서 (승인 뒤 Claude)

1. 유씨 문단(§2-3) 받기 → 다듬어 두 분 확인
2. dry-run → `qa-reports/` 백업 → DB 반영(content · title · seo_title · meta_description · tags · faq_json · summary_ko)
3. `/api/revalidate`(글 · /blog · sitemap · feed · llms-full) → 라이브 확인(직답 문단 · h3 3개 · FAQPage 7문항 · 실명 0)
4. 발행 직후 뉴스레터 한 번 + 유씨 1:1 전달용 한 줄 문구
5. 12월 둘째 주: 검색 콘솔에서 "consolidating" 검색어 클릭 확인(판결의 성공 기준: 클릭 0 탈출 · 외부 유입 두 주 연속 주 30 이상)
