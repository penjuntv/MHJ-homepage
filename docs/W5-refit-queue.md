# W5 정비 큐 — 무엇을 먼저 고칠까

> `node --env-file=.env.local scripts/report-refit-queue.mjs --write` 로 다시 만든다. 생성일 2026-09-10 · 발행 80편.
> **본문은 두 분이 쓴다.** 이 문서는 "무엇이 비어 있는지"만 말한다(마스터 플랜 §W5).
> 판정은 `lib/seo-defects.mjs` — 관리자 화면(`/mhj-desk/seo`)·주간 감사와 같은 함수다.

## 전체 현황

| 항목 | 해당 글 | 성격 |
|---|---|---|
| alt 없는 이미지 | 3 | 필수 결함 |
| 내부 링크 0개 | 10 | 필수 결함 |
| 400단어 미만 | 36 | 기준선 경고 |
| H2 소제목 부족 | 6 | 기준선 경고 |
| 지역 신호 없음 | 23 | 기준선 경고 |
| OG 이미지 자동 생성 | 59 | 기준선 경고 |
| seo_title 없음 | 80 | 운영 지표 |
| 한국어 요약 없음 | 80 | 운영 지표 |
| FAQ 없음 | 80 | 운영 지표 |
| 90일 이상 미갱신 | 67 | 운영 지표 |
| 태그 없음 | 3 | 운영 지표 |

결함이 하나도 없는 글 5편. 아래 큐는 기준선 결함이 있는 75편을 조회수 × 결함 수로 정렬한 것이다.

## 정비 큐 (상위 20편)

### 1. [The Word Cards](https://www.mhj.nz/blog/the-word-cards)

`the-word-cards` · Little 15 Mins · 조회 35 · 본문 211단어 · H2 2 · 내부링크 1

- [ ] 이미지 alt 채우기 — 설명이 없는 사진 2장
- [ ] 내부 링크 1개 더(허브 1개 포함) — 현재 1개
- [ ] 본문 확장 — 현재 211단어, 400단어가 기준선
- [ ] H2 소제목 1개 더(1개는 질문형) — 현재 2개
- [ ] 지역 신호 — 본문에 Mairangi·Auckland·North Shore 중 하나
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 2. [[Edu] How To Read a Mid-year Report](https://www.mhj.nz/blog/how-to-read-a-mid-year-report)

`how-to-read-a-mid-year-report` · Settlement · 조회 30 · 본문 1040단어 · H2 0 · 내부링크 0

- [ ] 이미지 alt 채우기 — 설명이 없는 사진 2장
- [ ] 내부 링크 2개 이상(허브 1개 포함) — 지금 0개라 색인에서 고립돼 있다
- [ ] H2 소제목 추가 — 현재 0개
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 3. [A Quiet Week Before the Break Ends](https://www.mhj.nz/blog/a-quiet-week-before-the-break-ends)

`a-quiet-week-before-the-break-ends` · Life in Aotearoa · 조회 40 · 본문 246단어 · H2 3 · 내부링크 1

- [ ] 내부 링크 1개 더(허브 1개 포함) — 현재 1개
- [ ] 본문 확장 — 현재 246단어, 400단어가 기준선
- [ ] 지역 신호 — 본문에 Mairangi·Auckland·North Shore 중 하나
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 4. [Starting School in New Zealand](https://www.mhj.nz/blog/starting-school-in-new-zealand)

`starting-school-in-new-zealand` · Home Learning · 조회 113 · 본문 998단어 · H2 3 · 내부링크 1

- [ ] 내부 링크 1개 더(허브 1개 포함) — 현재 1개
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 5. [The App We Dreamt Of](https://www.mhj.nz/blog/the-app-we-dreamt-of)

`the-app-we-dreamt-of` · Little 15 Mins · 조회 35 · 본문 385단어 · H2 3 · 내부링크 1

- [ ] 내부 링크 1개 더(허브 1개 포함) — 현재 1개
- [ ] 본문 확장 — 현재 385단어, 400단어가 기준선
- [ ] 지역 신호 — 본문에 Mairangi·Auckland·North Shore 중 하나
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 6. [Our library haul](https://www.mhj.nz/blog/our-library-haul)

`our-library-haul` · Life in Aotearoa · 조회 18 · 본문 448단어 · H2 0 · 내부링크 0

- [ ] 이미지 alt 채우기 — 설명이 없는 사진 5장
- [ ] 내부 링크 2개 이상(허브 1개 포함) — 지금 0개라 색인에서 고립돼 있다
- [ ] H2 소제목 추가 — 현재 0개
- [ ] 지역 신호 — 본문에 Mairangi·Auckland·North Shore 중 하나
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 7. [[Y7] Kahu Manu (1) New way of learning](https://www.mhj.nz/blog/y7-kahu-manu-new-way-of-learning)

`y7-kahu-manu-new-way-of-learning` · Home Learning · 조회 36 · 본문 595단어 · H2 2 · 내부링크 1

- [ ] 내부 링크 1개 더(허브 1개 포함) — 현재 1개
- [ ] H2 소제목 1개 더(1개는 질문형) — 현재 2개
- [ ] 지역 신호 — 본문에 Mairangi·Auckland·North Shore 중 하나
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 8. [Holiday Home Learning: The Reading Bingo](https://www.mhj.nz/blog/holiday-home-learning-the-reading-bingo)

`holiday-home-learning-the-reading-bingo` · Home Learning · 조회 17 · 본문 348단어 · H2 1 · 내부링크 0

- [ ] 내부 링크 2개 이상(허브 1개 포함) — 지금 0개라 색인에서 고립돼 있다
- [ ] 본문 확장 — 현재 348단어, 400단어가 기준선
- [ ] H2 소제목 2개 더(1개는 질문형) — 현재 1개
- [ ] 지역 신호 — 본문에 Mairangi·Auckland·North Shore 중 하나
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 9. [[Y1] She's Already There](https://www.mhj.nz/blog/shes-already-there)

`shes-already-there` · Little 15 Mins · 조회 19 · 본문 300단어 · H2 3 · 내부링크 1

- [ ] 내부 링크 1개 더(허브 1개 포함) — 현재 1개
- [ ] 본문 확장 — 현재 300단어, 400단어가 기준선
- [ ] 지역 신호 — 본문에 Mairangi·Auckland·North Shore 중 하나
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 10. [Night Market Tuesdays](https://www.mhj.nz/blog/night-market-tuesdays)

`night-market-tuesdays` · Life in Aotearoa · 조회 28 · 본문 360단어 · H2 4 · 내부링크 1

- [ ] 내부 링크 1개 더(허브 1개 포함) — 현재 1개
- [ ] 본문 확장 — 현재 360단어, 400단어가 기준선
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 11. [[Y7] Kahu Manu (2) Life in Pages](https://www.mhj.nz/blog/y7-kahu-manu-2-life-in-pages)

`y7-kahu-manu-2-life-in-pages` · Life in Aotearoa · 조회 18 · 본문 535단어 · H2 0 · 내부링크 2

- [ ] H2 소제목 추가 — 현재 0개
- [ ] 지역 신호 — 본문에 Mairangi·Auckland·North Shore 중 하나
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 12. [Word Fun at Dinner](https://www.mhj.nz/blog/word-fun-at-dinner)

`word-fun-at-dinner` · Home Learning · 조회 17 · 본문 330단어 · H2 2 · 내부링크 1

- [ ] 내부 링크 1개 더(허브 1개 포함) — 현재 1개
- [ ] 본문 확장 — 현재 330단어, 400단어가 기준선
- [ ] H2 소제목 1개 더(1개는 질문형) — 현재 2개
- [ ] 지역 신호 — 본문에 Mairangi·Auckland·North Shore 중 하나
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 13. [A Short Family Trip to Rotorua](https://www.mhj.nz/blog/a-short-family-trip-to-rotorua)

`a-short-family-trip-to-rotorua` · Life in Aotearoa · 조회 16 · 본문 222단어 · H2 0 · 내부링크 0

- [ ] 내부 링크 2개 이상(허브 1개 포함) — 지금 0개라 색인에서 고립돼 있다
- [ ] 본문 확장 — 현재 222단어, 400단어가 기준선
- [ ] H2 소제목 3개 더(1개는 질문형) — 현재 0개
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 14. [[Y1] First Term Report](https://www.mhj.nz/blog/jins-first-term-report-year-1-nz)

`jins-first-term-report-year-1-nz` · Little 15 Mins · 조회 23 · 본문 298단어 · H2 2 · 내부링크 1

- [ ] 내부 링크 1개 더(허브 1개 포함) — 현재 1개
- [ ] 본문 확장 — 현재 298단어, 400단어가 기준선
- [ ] H2 소제목 1개 더(1개는 질문형) — 현재 2개
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 15. [[Y7] Intermediate Guide: Specialist Subjects](https://www.mhj.nz/blog/intermediate-guide-specialist-subjects)

`intermediate-guide-specialist-subjects` · Home Learning · 조회 22 · 본문 340단어 · H2 3 · 내부링크 1

- [ ] 내부 링크 1개 더(허브 1개 포함) — 현재 1개
- [ ] 본문 확장 — 현재 340단어, 400단어가 기준선
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 16. [Honestly, I got lost](https://www.mhj.nz/blog/honestly-i-got-lost.)

`honestly-i-got-lost.` · Life in Aotearoa · 조회 14 · 본문 458단어 · H2 0 · 내부링크 0

- [ ] 내부 링크 2개 이상(허브 1개 포함) — 지금 0개라 색인에서 고립돼 있다
- [ ] H2 소제목 추가 — 현재 0개
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 17. [So We Made Our Own](https://www.mhj.nz/blog/so-we-made-our-own)

`so-we-made-our-own` · Little 15 Mins · 조회 13 · 본문 336단어 · H2 4 · 내부링크 1

- [ ] 내부 링크 1개 더(허브 1개 포함) — 현재 1개
- [ ] 본문 확장 — 현재 336단어, 400단어가 기준선
- [ ] 지역 신호 — 본문에 Mairangi·Auckland·North Shore 중 하나
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 18. [Blessings for the Lost ](https://www.mhj.nz/blog/blessings-for-the-lost)

`blessings-for-the-lost` · Life in Aotearoa · 조회 12 · 본문 512단어 · H2 0 · 내부링크 0

- [ ] 내부 링크 2개 이상(허브 1개 포함) — 지금 0개라 색인에서 고립돼 있다
- [ ] H2 소제목 추가 — 현재 0개
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개
- [ ] 태그

### 19. [IVE World Tour : SHOW WHAT I AM](https://www.mhj.nz/blog/ive-world-tour-show-what-i-am)

`ive-world-tour-show-what-i-am` · Life in Aotearoa · 조회 11 · 본문 763단어 · H2 0 · 내부링크 0

- [ ] 내부 링크 2개 이상(허브 1개 포함) — 지금 0개라 색인에서 고립돼 있다
- [ ] H2 소제목 추가 — 현재 0개
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

### 20. [[Y1] A Cookie Jar of Numbers — Jin's First 1 to 20](https://www.mhj.nz/blog/a-cookie-jar-of-numbers-jin-s-first-1-to-20)

`a-cookie-jar-of-numbers-jin-s-first-1-to-20` · Little 15 Mins · 조회 10 · 본문 368단어 · H2 2 · 내부링크 1

- [ ] 내부 링크 1개 더(허브 1개 포함) — 현재 1개
- [ ] 본문 확장 — 현재 368단어, 400단어가 기준선
- [ ] H2 소제목 1개 더(1개는 질문형) — 현재 2개
- [ ] 지역 신호 — 본문에 Mairangi·Auckland·North Shore 중 하나
- [ ] 대표 사진 지정(지금은 자동 생성 이미지로 공유된다)
- [ ] Key takeaways — `Key takeaways` 제목 + 불릿 3~5개(그래야 박스로 나온다)
- [ ] seo_title(30~60자) — 지면 제목은 그대로 두고 검색용만
- [ ] 한국어 요약 2~3문단
- [ ] FAQ 2~3개

## 전 편 공통 (W4-C 폼에서 채운다)

`seo_title` · 한국어 요약 · FAQ · 관련 글은 현재 거의 모든 글이 비어 있다. 큐를 도는 김에 함께 채우면 두 번 열지 않는다.
글을 저장할 때 폼 아래 "발행 전 체크리스트"가 남은 항목을 그대로 보여준다.

---

정비 한 단락이 끝날 때마다: `node --env-file=.env.local scripts/audit-seo-regression.mjs --update-baseline`
