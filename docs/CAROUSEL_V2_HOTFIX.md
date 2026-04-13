# CAROUSEL V2 긴급 수정 — 폴리싱 세션

> 이 파일을 읽고 바로 실행하세요. Plan Mode 필요 없음.

## 문제 요약

1. **points가 비어 있으면 슬라이드 3~6이 빈 화면** — title/body가 빈 문자열
2. **Gemini 모델 ID 만료** — `gemini-2.0-flash` → 404 에러
3. **convertInput에서 pullQuote/summaryPoints/yussiTake가 비면 슬라이드 7~9도 비어 보임**

## 반드시 먼저 읽을 파일

```
components/carousel/v2/convertInput.ts     ← 핵심 수정 대상
app/api/carousel/ai-layout/route.ts        ← Gemini 모델 ID 수정
```

## 참고: yussi-inata 레포 클론

```bash
git clone https://github.com/penjuntv/yussi-inata.git /tmp/yussi-inata
```

yussi-inata의 dummySlides를 보면 **모든 슬라이드에 title과 content가 풍부하게 채워져 있음**.
빈 슬라이드가 생기는 건 MHJ convertInput의 fallback 부족 때문.

---

## 수정 1: Gemini 모델 ID 변경

파일: `app/api/carousel/ai-layout/route.ts`

`gemini-2.0-flash` → `gemini-2.5-flash` 로 변경.

이 한 줄만 바꾸면 AI Generate 탭이 동작함.

---

## 수정 2: convertInput fallback 강화

파일: `components/carousel/v2/convertInput.ts`

**핵심 원칙: 어떤 입력이 들어와도 빈 슬라이드가 나오면 안 됨.**

블로그 글을 선택했는데 carousel_* 데이터(points)가 비어 있을 수 있음.
그 경우에도 블로그의 title, meta_description, category로 기본 콘텐츠를 채워야 함.

```typescript
export function convertInputToSlides(input: CarouselInput): SlideConfig[] {
  const slides: SlideConfig[] = [];
  const blogTitle = input.title || 'MHJ';
  const blogSubtitle = input.subtitle || '';
  const category = input.category || 'LIFE IN AOTEAROA';
  const imageUrl = input.coverImageUrl;

  // 슬라이드 1: 커버
  slides.push({
    id: 1,
    layout: 'cover-arch',
    title: blogTitle,
    subtitle: category.toUpperCase(),
    imageUrl,
    stepNumber: 1,
  });

  // 슬라이드 2: 컨텍스트
  slides.push({
    id: 2,
    layout: 'content-quote',
    title: blogSubtitle || blogTitle,
    body: blogSubtitle || `A guide for families navigating life in New Zealand.`,
    stepNumber: 2,
  });

  // 슬라이드 3-6: 콘텐츠 포인트
  const points = input.points ?? [];
  const fallbackTitles = [
    'What you need to know',
    'How it works in NZ',
    'Our experience',
    'What we recommend',
  ];
  const fallbackBodies = [
    `Here's what we learned as an immigrant family in Auckland.`,
    `This is how the system works — and what surprised us.`,
    `After three years in NZ, this is our honest take.`,
    `If we could start over, this is what we'd do differently.`,
  ];

  for (let i = 0; i < 4; i++) {
    const pt = points[i];
    const hasContent = pt?.title && pt.title.trim().length > 0;
    slides.push({
      id: i + 3,
      layout: CONTENT_LAYOUTS[i % CONTENT_LAYOUTS.length],
      title: hasContent ? pt.title : fallbackTitles[i],
      body: hasContent ? (pt.body || pt.highlight || '') : fallbackBodies[i],
      imageUrl,
      stepNumber: i + 1, // 포인트 번호는 1부터
    });
  }

  // 슬라이드 7: 비주얼 브레이크
  slides.push({
    id: 7,
    layout: 'visual-break',
    title: input.pullQuote || blogTitle,
    body: input.pullQuote || '',
    imageUrl: input.visualImageUrl || imageUrl,
    stepNumber: 7,
  });

  // 슬라이드 8: 요약 체크리스트
  const summaryPoints = (input.summaryPoints ?? []).filter(Boolean);
  const summaryText = summaryPoints.length > 0
    ? summaryPoints.join('\n')
    : `✓ Research before you move\n✓ Connect with local communities\n✓ Give yourself time to adjust\n✓ Read more at mhj.nz`;
  slides.push({
    id: 8,
    layout: 'summary-checklist',
    title: 'Key Takeaways',
    body: summaryText,
    subtitle: (input.summaryKr ?? []).filter(Boolean).join(' · ') || undefined,
    stepNumber: 8,
  });

  // 슬라이드 9: Yussi Take
  slides.push({
    id: 9,
    layout: 'yussi-take',
    title: "Yussi's Take",
    body: input.yussiTake || `As a mum of three and social work student, I believe every family deserves the time and space to find their rhythm in a new country.`,
    subtitle: input.yussiTakeKr || undefined,
    stepNumber: 9,
  });

  // 슬라이드 10: CTA
  slides.push({
    id: 10,
    layout: 'cta-minimal',
    title: input.ctaTitle || 'Was this helpful?',
    subtitle: input.ctaUrl || 'www.mhj.nz',
    body: `More stories at ${input.instagramHandle ?? '@mhj_nz'}`,
    stepNumber: 10,
  });

  return slides;
}
```

---

## 수정 3: 레이아웃 컴포넌트 빈 텍스트 방어

**모든** `components/carousel/v2/layouts/*.tsx` 파일에서:

title이 빈 문자열일 때 해당 요소를 숨기거나 placeholder를 표시해야 함.
최소한 아래처럼 방어:

```typescript
// 각 레이아웃에서 title 렌더링 부분:
// BEFORE:
<h2 style={{...}}>{config.title}</h2>

// AFTER:
{config.title && (
  <h2 style={{...}}>{config.title}</h2>
)}
```

body도 동일하게 처리.

빈 문자열을 렌더링하면 빈 공간만 차지하고 보기 흉함.
**하지만 수정 2에서 fallback을 채워넣었으니, 이건 추가 안전장치.**

---

## 검증

```bash
npm run build
# localhost:3003/mhj-desk/carousel
# 1) Blog 탭 → carousel 데이터가 비어있는 블로그 선택 → Generate
#    → 모든 10장에 텍스트가 보여야 함 (fallback 텍스트)
# 2) AI Generate 탭 → 아무 텍스트 입력 → Gemini 에러 없이 10장 생성
# 3) 슬라이드 3~6에서 제목+본문이 비어있지 않은지 확인
```

---

*모델: Sonnet. 이 수정은 10분 이내로 끝나야 함.*
