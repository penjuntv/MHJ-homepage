# MHJ 홈페이지 디자인 스펙 v2
## Claude Code 구현 가이드 — 색감/대비/섹션 분리 개편

*2026-04-09 벤치마크 리서치 기반 확정*
*이 문서를 `docs/HOMEPAGE_DESIGN_SPEC_V2.md`에 복사 후 Claude Code에서 참조*

---

## 벤치마크 요약 → MHJ 적용

| 벤치마크 | 핵심 패턴 | MHJ 적용 |
|---------|----------|---------|
| Cup of Jo | 대형 히어로 이미지 + 발췌문, 댓글 수 강조 | 히어로 그라데이션 강화, 뷰 카운트 강조 |
| Kinfolk | 순백 + 사진 톤으로만 리듬, 극도로 미니멀 | 섹션 간 여백으로 호흡, 카드 미니멀 유지 |
| The Everygirl | 텍스트 리스트 섹션 (이미지 없음)으로 밀도 확보 | Most Read를 텍스트 리스트로 유지 (현행 OK) |
| Camille Styles | 비대칭 그리드 + 태그 버튼 그룹 | 히어로 아래 태그 버튼 추가 검토 |
| Cereal | 내비게이션 없음, 랜덤 갤러리, 2서체 1사이즈 | 서체 일관성 유지, 불필요한 장식 제거 |
| Design Mom | 단일 컬럼, 댓글 수 강조, 소박한 구조 | 참고만 (MHJ는 더 매거진적) |

---

## 현재 문제 → 해결 전략

### 문제 1: 크림 위에 크림 (배경 교대 없음)

**현재:** 전체 페이지가 `#FAF8F5` 단일 배경. 섹션 경계가 보이지 않음.

**해결:** 3단계 배경 교대 시스템

```
섹션 배경 교대 패턴:

[히어로]          → 이미지 위 그라데이션 (기존)
[인트로]          → #FAF8F5 (크림) ← 현행 유지
[Latest 9]        → #FFFFFF (순백)  ← 변경
[Newsletter CTA]  → #3D2E1F (다크 브라운) ← 변경 (대반전)
[Explore by Topic] → #FAF8F5 (크림) ← 현행
[Most Read]        → #F0EBE3 (진한 크림) ← 변경
[From Archive]     → #FFFFFF (순백) ← 변경
[Footer]           → #1A1814 (다크) ← 현행
```

**핵심 원칙:**
- 인접 섹션은 반드시 다른 배경
- Newsletter CTA는 다크 배경으로 "시각적 중단점" (Cup of Jo, Camille Styles 모두 뉴스레터 영역을 배경 반전)
- 순백(`#FFFFFF`)과 크림(`#FAF8F5`)은 미묘하지만 확실한 차이 — 나란히 있으면 눈에 보임

### 문제 2: CTA가 눈에 안 띔

**현재:** NewsletterCTA가 크림 배경 위에 크림 카드. 거의 invisible.

**해결:** 다크 브라운 전폭 배경 반전

```css
/* Newsletter CTA 섹션 */
.newsletter-section {
  background-color: #3D2E1F;
  padding: 80px 0;
  /* 전폭 — max-width 1320px 밖에서 배경 확장 */
}

.newsletter-section h2 {
  color: #FAF8F5;
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 32px;  /* 현재보다 키움 */
}

.newsletter-section p {
  color: rgba(250, 248, 245, 0.7);
}

.newsletter-section input {
  background: rgba(250, 248, 245, 0.1);
  border: 1px solid rgba(250, 248, 245, 0.3);
  color: #FAF8F5;
}

.newsletter-section button {
  background-color: #C9A96E;  /* 골드 */
  color: #3D2E1F;
  font-weight: 700;
}
```

### 문제 3: 카드에 깊이감 없음

**현재:** 카드가 배경과 평면적으로 붙어 있음.

**해결:** 미묘한 그림자 + hover 효과

```css
/* Blog/Post 카드 */
.post-card {
  background: #FFFFFF;
  border-radius: 6px;  /* DESIGN_RULES 유지 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 
              0 1px 2px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease, opacity 0.2s ease;
}

.post-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 
              0 2px 4px rgba(0, 0, 0, 0.06);
  /* translateY 금지 — DESIGN_RULES */
  /* scale(1.02)는 허용이지만 카드에서는 과할 수 있음 */
}

/* 순백 배경 섹션에서는 카드 배경을 #FAF8F5로 */
.section-white .post-card {
  background: #FAF8F5;
}
```

**중요:** `translateY` hover는 DESIGN_RULES에서 금지. `box-shadow` 변화와 `opacity` 변화만 허용.

### 문제 4: 섹션 라벨이 약함

**현재:** 섹션 제목이 작은 텍스트.

**해결:** 섹션 라벨 시스템

```
섹션 라벨 구조:

[카테고리 바] ─── 섹션 제목 ─── [View All →]

카테고리 바:
  - 좌측에 4px 세로선 (높이 24px)
  - 색상: #8A6B4F (브라운)
  - 제목: Noto Sans KR 700, 14px, letter-spacing 3px, uppercase
  - 색상: #8A6B4F

우측 "View All":
  - Noto Sans KR 400, 14px
  - 색상: #8A6B4F
  - hover: underline
```

또는 더 미니멀하게:
```
섹션 제목만:
  Playfair Display 700, 28px, 색상: #1A1A1A
  하단에 1px 라인 (#E5E0D8) 전폭
  라인과 제목 사이 16px
```

→ **두 번째 옵션 추천** (Kinfolk/Cereal 스타일에 가까움)

---

## 섹션별 상세 스펙

### 1. 히어로 캐러셀 (기존 유지, 미세 조정)

```
변경 없음 (이미 작동 중)
미세 조정만:
- 그라데이션 하단 진하게: 
  linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)
- 히어로 텍스트 max-width: 720px로 제한 (긴 제목이 전폭으로 늘어지지 않게)
```

### 2. 인트로 섹션

```
배경: #FAF8F5 (현행)
패딩: 80px 0 64px
최대폭: 720px, 중앙 정렬

"A family archive from Mairangi Bay, Auckland."
→ Playfair Display 400 italic, 24px, 색상: #1A1A1A

서브텍스트
→ Noto Sans KR 400, 16px, 색상: #64748B, line-height 1.7
```

### 3. Latest 9 Posts

```
배경: #FFFFFF ← 변경 (크림과 구분)
패딩: 64px 0 80px

섹션 라벨: "Latest" — Playfair Display 700, 28px
하단 1px 라인 (#E5E0D8)

카드 그리드: 3×3 (데스크탑), 2열 (태블릿), 1열 (모바일)
카드: box-shadow 적용 (위 참고)
카드 배경: #FAF8F5 (순백 위에 크림 카드 = 은은한 차이)
```

### 4. Newsletter CTA ★★★

```
배경: #3D2E1F (다크 브라운) — 전폭
패딩: 80px 0
내부 콘텐츠: max-width 600px, 중앙 정렬

타이틀: "Mairangi Notes"
  Playfair Display 700, 36px, 색상: #FAF8F5

서브텍스트: "Weekly stories from Mairangi Bay."
  Noto Sans KR 400, 18px, 색상: rgba(250,248,245,0.7)

입력 필드 + 버튼: 가로 배치 (데스크탑), 세로 (모바일)
  입력: 배경 rgba(250,248,245,0.1), 테두리 rgba(250,248,245,0.3)
  버튼: 배경 #C9A96E, 텍스트 #3D2E1F, font-weight 700
  
FREE 배지 (기존): 유지, 색상만 골드로 조정
Lead magnet 텍스트: 색상 #C9A96E

Privacy 링크: rgba(250,248,245,0.4)
```

### 5. Explore by Topic

```
배경: #FAF8F5 (크림)
패딩: 64px 0 80px

섹션 라벨: 카테고리명 — Playfair Display 700, 24px
우측: "View All" 링크

카드: 2열 가로 배치 (각 카테고리당)
카드 배경: #FFFFFF (크림 위에 흰 카드)
카드 box-shadow 적용
```

### 6. Most Read

```
배경: #F0EBE3 (진한 크림) ← 변경
패딩: 64px 0 80px

현행 텍스트 리스트 구조 유지 (이미 좋음)
번호: Playfair Display 700, 32px, 색상: #C9A96E (골드로 변경)
카테고리: Noto Sans KR 700, 11px, letter-spacing 2px, 색상: #8A6B4F
제목: Noto Sans KR 500, 16px, 색상: #1A1A1A
```

### 7. From the Archive

```
배경: #FFFFFF (순백)
패딩: 64px 0 80px

섹션 라벨: "From the Archive" — Playfair Display 700, 28px
카드: 3열 가로 (현행)
카드 배경: #FAF8F5
카드 box-shadow 적용
```

---

## 다크모드 대응

| 라이트 | 다크 |
|--------|------|
| `#FFFFFF` (순백) | `#1A1814` |
| `#FAF8F5` (크림) | `#23201B` |
| `#F0EBE3` (진한 크림) | `#2A2520` |
| `#3D2E1F` (다크 브라운) | `#2A2015` (약간 밝게) |
| `#C9A96E` (골드) | `#C9A882` (기존 다크 골드) |
| 카드 box-shadow | `rgba(0,0,0,0.2)` 계열로 강화 |
| Newsletter CTA 배경 | `#2A2015` (브라운 계열 유지) |

---

## 모바일 (375px) 대응

```
- 히어로: 높이 60vh → 50vh
- Latest 그리드: 3열 → 1열
- Newsletter CTA: 가로 → 세로 레이아웃
- 섹션 패딩: 80px → 48px
- 섹션 제목: 28px → 24px
- 카드 여백: 양옆 16px
```

---

## 수정 범위 & 주의사항

### 수정할 파일
```
app/(public)/page.tsx           — 섹션 배경색 래퍼, 클래스 추가
app/globals.css                 — 새 배경색 변수, 카드 그림자, 다크모드
components/NewsletterCTA.tsx    — 다크 배경 반전 (기존 구조 유지, 색상만)
components/PostCard.tsx         — box-shadow 추가
components/BlogCard.tsx         — box-shadow 추가 (사용되는 경우)
```

### 절대 건드리지 않을 파일
```
app/api/subscribe/route.ts     — 구독 로직
components/InlineSubscribeCTA.tsx — 블로그 중간 CTA
app/(public)/blog/[slug]/page.tsx — 블로그 상세
```

### DESIGN_RULES 준수 확인
- ✅ radius ≤ 12px (카드 6px 유지)
- ✅ translateY hover 금지 (box-shadow만)
- ✅ heading 72px cap
- ✅ 콘텐츠 max-width 1320px
- ✅ 8px 그리드
- ✅ achromatic + 브라운/골드 (인디고는 AI Insight only)

---

## 변경 전후 비교 요약

| 항목 | AS-IS (55점) | TO-BE (75점 목표) |
|------|-------------|------------------|
| 섹션 배경 | 전체 #FAF8F5 | 3색 교대 (크림/순백/진한크림) |
| Newsletter CTA | 크림 위 크림 카드 | 다크 브라운 전폭 반전 |
| 카드 깊이 | 평면 | box-shadow + hover 강화 |
| 섹션 라벨 | 작은 텍스트 | Playfair 28px + 하단 라인 |
| Most Read 번호 | 기본 텍스트 | 골드 대형 번호 (32px) |
| 그라데이션 | 약함 | 히어로 하단 60% 불투명도 |

---

**커밋 메시지:** `design: homepage visual density — section contrast, card shadows, dark newsletter CTA, gold accents`
