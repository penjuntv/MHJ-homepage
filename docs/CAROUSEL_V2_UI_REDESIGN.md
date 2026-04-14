# CAROUSEL V2 — 편집 UI 리디자인 + 에셋 라이브러리

> POLISH 이슈 6건 수정 완료 반영. 이 세션은 편집 UX 개선에 집중.
> 모델: Opus
> yussi-inata 참고: `git clone https://github.com/penjuntv/yussi-inata.git /tmp/yussi-inata`

## 반드시 먼저 읽을 파일

```
docs/DESIGN_RULES.md
components/carousel/v2/SlideEditPanel.tsx    ← 현재 편집 패널 (리디자인 대상)
components/carousel/v2/LivePreview.tsx       ← 미리보기 (개선 대상)
components/carousel/v2/NZIcons.tsx           ← 기존 NZ 아이콘
app/mhj-desk/carousel/page.tsx              ← Admin 페이지
```

## yussi-inata 참고 파일

```
/tmp/yussi-inata/src/App.tsx
→ SlidePreview 함수 내 "Editor Controls" 섹션 (line ~480)
→ "NZ Asset Library" 모달 (에셋 라이브러리)
→ 슬라이드 2열 그리드 ("grid grid-cols-1 md:grid-cols-2 gap-8")
```

---

## 현재 문제

MHJ의 편집 UI: LAYOUT / TEXT / FILTER / COLOR / FONT / ICON — 6개 탭 버튼이 작고 빽빽.
yussi-inata: Layout 드롭다운 + Photo / Assets / Text / 색상 피커 — 간결하고 시원시원.

**yussi-inata의 편집 UX 구조를 그대로 따라가되, MHJ 브랜드 톤 유지.**

---

## 수정 1: SlideEditPanel 리디자인

현재 `SlideEditPanel.tsx`를 **전면 교체**.

yussi-inata의 "Editor Controls" 구조를 참고:

```
┌─────────────────────────────────────────────────┐
│ [📐 Cover (Arch) ▼]                              │  ← 레이아웃 드롭다운
│                                                   │
│ [📷 Photo] [📦 Assets] [✏️ Text] [🎨] [🖼️]      │  ← 액션 버튼들
└─────────────────────────────────────────────────┘
```

구현:

```typescript
// 상단: 레이아웃 선택 드롭다운 (yussi-inata의 LayoutTemplate + 이름 + ChevronDown)
<button onClick={() => setIsLayoutModalOpen(true)} style={{
  display: 'flex', alignItems: 'center', gap: 8,
  background: '#FAF8F5', border: '1px solid #EDE9E3', borderRadius: 8,
  padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
}}>
  <LayoutTemplate size={16} />
  {currentLayoutName}
  <ChevronDown size={14} style={{ opacity: 0.5 }} />
</button>

// 하단: 5개 액션 버튼 (아이콘 + 짧은 라벨)
// Photo — 이미지 업로드 (사진 지원 레이아웃에서만 표시)
// Assets — NZ Asset Library 모달
// Text — 텍스트 편집 오버레이
// 색상 피커 — 배경색 변경 (원형 컬러 input)
// 필터 아이콘 — 이미지 필터 (사진 있을 때만)
```

**기존 6개 탭(LAYOUT/TEXT/FILTER/COLOR/FONT/ICON) 방식 → 제거.**
**레이아웃 선택은 드롭다운으로, 나머지는 직접 액션 버튼으로.**

---

## 수정 2: NZ Asset Library 모달

yussi-inata의 에셋 라이브러리를 **그대로 구현 + 사진 확장**.

### 구조

```
┌─ NZ Asset Library ─────────────── ✕ ─┐
│                                       │
│ [Photos]  [Accents & Shapes]          │  ← 탭 2개
│                                       │
│  ┌──────────┐  ┌──────────┐          │
│  │  사진1    │  │  사진2    │          │  ← 2열 그리드
│  │ [Use]    │  │ [Use]    │          │
│  └──────────┘  └──────────┘          │
│  ┌──────────┐  ┌──────────┐          │
│  │  사진3    │  │  사진4    │          │
│  │ [Use]    │  │ [Use]    │          │
│  └──────────┘  └──────────┘          │
│                                       │
└───────────────────────────────────────┘
```

### Photos 탭 — MHJ 전용 사진 (Unsplash 무료 이미지)

yussi-inata는 picsum.photos를 쓰는데 품질이 낮음.
MHJ는 **Unsplash** 무료 이미지를 카테고리별로 제공:

```typescript
const ASSET_PHOTOS = [
  // 🍱 도시락/음식 (Life in Aotearoa — Lunch Box)
  { url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', label: 'Healthy lunch' },
  { url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80', label: 'Fresh food' },
  { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', label: 'Meal prep' },

  // 🏖️ NZ 자연
  { url: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80', label: 'NZ coastline' },
  { url: 'https://images.unsplash.com/photo-1469521669194-babb45599def?w=800&q=80', label: 'NZ mountains' },
  { url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80', label: 'Green hills' },
  { url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80', label: 'Waterfall' },

  // 📚 학교/교육
  { url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', label: 'School supplies' },
  { url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80', label: 'Study desk' },
  { url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80', label: 'Books' },

  // 🏠 가정/라이프스타일
  { url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80', label: 'Cozy home' },
  { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', label: 'Coffee morning' },

  // 🌿 미니멀/텍스처 배경
  { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', label: 'Linen texture' },
  { url: 'https://images.unsplash.com/photo-1533035353720-f1c6a75cd8ab?w=800&q=80', label: 'Warm tones' },
  { url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80', label: 'Soft gradient' },
];
```

### Accents & Shapes 탭 — NZ 아이콘 11개

yussi-inata의 NZ_ACCENTS 배열을 그대로 사용:
- Squiggle, Leaf, Koru, Silver Fern, Kiwi Bird, Mountains, NZ Map, Southern Cross, Education, Sun Rays, Organic Blob

각 아이콘을 **카드형으로 크게 표시** (yussi-inata 스타일 — 둥근 사각형 카드, 중앙에 아이콘 SVG, 하단에 이름).

클릭 시 해당 슬라이드의 `accentIcon`에 적용.

---

## 수정 3: 레이아웃 선택 모달 개선

현재: 버튼 태그들이 빽빽하게 나열 (Minimal, Arch, Full Image, Split...)
변경: yussi-inata 스타일 — **카드형 2열 그리드 모달**

```
┌─ Template Library ──────────── ✕ ─┐
│                                    │
│  ┌─────────────┐ ┌─────────────┐  │
│  │ [아이콘]     │ │ [아이콘]     │  │
│  │ Cover (Arch)│ │ Cover Split │  │
│  │ Elegant...  │ │ Modern...   │  │
│  └─────────────┘ └─────────────┘  │
│  ┌─────────────┐ ┌─────────────┐  │
│  │ [아이콘]     │ │ [아이콘]     │  │
│  │ Editorial   │ │ Step List   │  │
│  │ Magazine... │ │ Numbered... │  │
│  └─────────────┘ └─────────────┘  │
│                                    │
└────────────────────────────────────┘
```

각 카드:
- 아이콘 (lucide-react)
- 레이아웃 이름 (bold)
- 1줄 설명 (muted)
- 현재 선택 → MHJ 골드 보더 (#C9A882)
- 클릭 → 레이아웃 변경 + 모달 닫기

카테고리 필터 탭 (선택사항):
`[All] [Cover] [Content] [Special] [Infographic]`

---

## 수정 4: 슬라이드 미리보기 2열 그리드 모드 추가

현재: 1장씩 좌우 네비게이션으로 보기.
추가: **2열 그리드 모드** (yussi-inata의 `grid grid-cols-1 md:grid-cols-2 gap-8`).

미리보기 상단에 뷰 토글 추가:

```
PREVIEW — LIVE          [1장] [전체]    ↩ ↪
```

- **1장 모드** (기존): 큰 슬라이드 1장 + 좌우 화살표 + dot indicator
- **전체 모드** (신규): 2열 그리드로 10장 전부 표시. 각 카드에 간이 편집 버튼

전체 모드에서 슬라이드 클릭 → 1장 모드로 전환 + 해당 슬라이드 선택.

---

## 수정 5: 텍스트 편집 오버레이 개선

현재 SlideEditPanel의 TEXT 탭 → 별도 오버레이로 변경.

yussi-inata 스타일: 슬라이드 위에 **반투명 오버레이**가 뜨면서 인라인 편집:

```
┌─ Edit Slide Content ──── [Done] ─┐
│                                    │
│ Step Number: [3        ]           │
│ Subtitle:    [LUNCHBOX GUIDE    ]  │
│ Title:       [Nut-free means... ]  │
│ Body:        [Even if your...   ]  │
│              [                   ]  │
│              [                   ]  │
│                                    │
└────────────────────────────────────┘
```

- 슬라이드 미리보기 위에 `backdrop-filter: blur(8px)` 오버레이
- 각 필드: 라벨 (uppercase, 작은 글씨) + input/textarea
- "Done" 버튼으로 닫기
- 닫으면 실시간 반영된 미리보기

---

## 수정 6: Export 버튼 위치 + 비율 선택

### Export 버튼

미리보기 하단에 **큼직하게**:

```
[⬇ Download All (ZIP)]  [⬇ PNG]  [4:5 ▼]
```

- Download All: 10장 ZIP
- PNG: 현재 보고 있는 슬라이드 개별 다운로드
- 비율 드롭다운: 4:5 (Portrait) / 1:1 (Square)

### 비율 변경 구현

```typescript
// page.tsx에 state 추가
const [aspectRatio, setAspectRatio] = useState<'portrait' | 'square'>('portrait');

// LivePreview에 전달
<LivePreview aspectRatio={aspectRatio} ... />

// ExportEngine에서 비율에 따라 크기 변경
const dims = aspectRatio === 'square'
  ? { width: 1080, height: 1080 }
  : { width: 1080, height: 1350 };

// 슬라이드 컨테이너의 aspect-ratio도 변경
style={{ aspectRatio: aspectRatio === 'square' ? '1/1' : '4/5' }}
```

---

## 수정 7: 드래프트 로드 복원 (이슈 7)

`page.tsx`의 RecentList `onLoad` 핸들러 수정:

```typescript
onLoad={(row) => {
  const restoredInput = { ...EMPTY_INPUT, ...(row.data || {}) };
  setInput(restoredInput);

  // 슬라이드 복원
  if (row.data?.slides && Array.isArray(row.data.slides)) {
    setSlides(row.data.slides);
  } else {
    setSlides(convertInputToSlides(restoredInput));
  }

  // 캡션 복원
  setCaption({
    en: row.caption_en || '',
    kr: row.caption_kr || '',
    hashtags: row.hashtags || ['#MHJnz'],
  });

  // 모드 + ID 복원
  setMode(row.blog_id ? 'blog' : 'independent');
  setBlogId(row.blog_id);
  setContentId(row.id);
}}
```

또한 `save-content` API에서 slides 배열도 함께 저장:

```typescript
// app/api/carousel/save-content/route.ts
// data 필드에 slides 포함
data: { ...input, slides: body.slides }
```

---

## 수정 8: 전체적인 Admin 톤 정리

- MHJ Admin 톤 유지: 배경 #F8FAFC, 카드 border #EDE9E3, 액센트 #8A6B4F
- **인디고(#4F46E5) 절대 사용 금지** (AI Insight 전용)
- 활성 상태 색상: #1A1A1A (다크) 또는 #8A6B4F (골드)
- 버튼: border-radius 8px, 가벼운 그림자
- 모달: border-radius 16px, backdrop-filter blur

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|---------|
| `v2/SlideEditPanel.tsx` | **전면 교체** — 드롭다운 + 액션 버튼 방식으로 |
| `v2/AssetLibrary.tsx` | **신규** — NZ Asset Library 모달 (Photos + Accents) |
| `v2/LayoutModal.tsx` | **신규** — 카드형 2열 그리드 레이아웃 선택 모달 |
| `v2/LivePreview.tsx` | 뷰 토글(1장/전체), 비율 선택, Export 위치 변경 |
| `v2/ExportEngine.tsx` | 비율 파라미터 추가 (portrait/square) |
| `app/mhj-desk/carousel/page.tsx` | aspectRatio state, RecentList onLoad 복원, slides 저장 |
| `app/api/carousel/save-content/route.ts` | slides 배열 함께 저장 |

---

## 검증

```bash
npm run build
# 1) 레이아웃 드롭다운 클릭 → 카드형 모달에서 레이아웃 선택 → 실시간 반영
# 2) Assets 버튼 → NZ Asset Library → Photos 탭에서 사진 선택 → 슬라이드에 적용
# 3) Assets → Accents 탭 → Koru 선택 → 슬라이드에 장식 표시
# 4) Text 버튼 → 오버레이에서 텍스트 편집 → Done → 실시간 반영
# 5) 전체 모드 토글 → 10장 2열 그리드 표시
# 6) 비율 선택 4:5 → 1:1 전환 → 슬라이드 비율 변경
# 7) Download All → ZIP 다운로드 성공
# 8) Save → Recent Carousels에서 로드 → 좌측 입력란 + 슬라이드 복원
```

---

*yussi-inata의 UX가 기준입니다. 그보다 더 시원시원하고 직관적으로.*
