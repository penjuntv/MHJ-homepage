# SUBSCRIBE_GROWTH.md — Claude Code 세션 지시서
# 구독 전환율 최적화 — 리드 마그넷 + CTA 재배치

> **이 파일을 읽고 그대로 실행하세요.**
> Plan Mode에서 계획을 세우고, 승인 후 실행하세요.

---

## 배경

현재 구독자 13명. 10일간 유기적 구독 0명. 원인:
1. 구독 CTA에 인센티브 없음 ("Weekly stories from Mairangi Bay")
2. 구독 폼이 페이지 최하단에만 있어서 대부분 못 봄
3. 리드 마그넷(무료 선물)이 없음

---

## 반드시 먼저 읽을 파일

```
docs/DESIGN_RULES.md
components/NewsletterCTA.tsx
app/(public)/blog/[slug]/page.tsx
app/(public)/page.tsx
app/api/subscribe/route.ts
```

---

## 구현 4가지

### 0. Supabase Storage에 PDF 업로드

프로젝트 루트 `docs/` 폴더에 2개 PDF가 있습니다:
- `docs/NZ_School_Starter_Pack.pdf` (영어+한글)
- `docs/NZ_School_Starter_Pack_ZH.pdf` (영어+중국어)

이 파일들을 Supabase Storage `images` 버킷의 `lead-magnets/` 경로에 업로드합니다.

임시 Node.js 스크립트를 만들어 실행:

```typescript
// scripts/upload-lead-magnets.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function upload() {
  const files = [
    { local: 'docs/NZ_School_Starter_Pack.pdf', remote: 'lead-magnets/NZ_School_Starter_Pack.pdf' },
    { local: 'docs/NZ_School_Starter_Pack_ZH.pdf', remote: 'lead-magnets/NZ_School_Starter_Pack_ZH.pdf' },
  ];
  for (const f of files) {
    const data = fs.readFileSync(path.resolve(f.local));
    const { error } = await supabase.storage
      .from('images')
      .upload(f.remote, data, { contentType: 'application/pdf', upsert: true });
    if (error) console.error(f.remote, error);
    else console.log('Uploaded:', f.remote);
  }
}
upload();
```

실행: `npx tsx scripts/upload-lead-magnets.ts`
실행 후 스크립트 삭제. curl로 200 확인.

SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없으면 이 단계를 건너뛰고 URL을 하드코딩합니다.

**최종 URL:**
```
https://vpayqdatpqajsmalpfmq.supabase.co/storage/v1/object/public/images/lead-magnets/NZ_School_Starter_Pack.pdf
https://vpayqdatpqajsmalpfmq.supabase.co/storage/v1/object/public/images/lead-magnets/NZ_School_Starter_Pack_ZH.pdf
```

---

### 1. NewsletterCTA 컴포넌트 변경

기존 `components/NewsletterCTA.tsx`를 수정합니다.

**현재 → 변경:**

| 요소 | 현재 | 변경 |
|------|------|------|
| 제목 | Mairangi Notes | NZ School Starter Pack |
| 제목 앞 | — | [FREE] pill 배지 |
| 부제 | Weekly stories from Mairangi Bay. | Enrolment checklist, school zone guide & budget breakdown — plus weekly stories from Mairangi Bay. |
| 버튼 | Subscribe → | Get the free guide → |
| 성공 메시지 | (기존) | 📬 + PDF 다운로드 링크 2개 |
| 중복 구독 | (에러) | "Already subscribed!" + PDF 링크 |

**FREE 배지 스타일:**
```css
display: inline-block;
background: #FEF3C7;
color: #92400E;
font-size: 10px;
font-weight: 700;
padding: 2px 10px;
border-radius: 10px;
letter-spacing: 1px;
margin-right: 8px;
```

**성공 시 PDF 링크 표시:**
```
📬 Check your inbox!
Download your Starter Pack:
🇬🇧🇰🇷 English + Korean  |  🇬🇧🇨🇳 English + Chinese
```
링크 스타일: `color: #8A6B4F; font-weight: 600; text-decoration: underline;`

**중복 구독 처리:**
- `app/api/subscribe/route.ts`의 응답을 확인하여, 이미 존재하는 이메일일 때의 응답 구조 파악
- 중복 시 에러가 아니라 `{ success: true, existing: true }` 같은 응답 반환하도록 수정 (필요시)
- 프론트에서 existing=true면 "You're already subscribed! Here's the guide:" + PDF 링크

**디자인:**
- 기존 레이아웃/배경 유지
- #8A6B4F 브랜드 색상
- 인디고 금지

---

### 2. InlineSubscribeCTA 신규 컴포넌트

**새 파일:** `components/InlineSubscribeCTA.tsx`

블로그 본문 중간에 삽입되는 구독 CTA. 'use client' 컴포넌트.

**디자인:**
```css
background: #FAF8F5;
border-left: 4px solid #8A6B4F;
border-radius: 0;
padding: 20px 24px;
margin: 32px 0;
```

**내용:**
```
📬 Free: NZ School Starter Pack
Enrolment checklist + zone guide + budget breakdown for immigrant families.
[email input]  [Send me the guide →]
```

- 기존 `/api/subscribe` 엔드포인트 사용
- 성공 시: "Done! 📬" + PDF 링크 (NewsletterCTA와 동일)
- 모바일 (max-width: 640px): 이메일 + 버튼 세로 스택

---

### 3. 블로그 상세 페이지 수정

`app/(public)/blog/[slug]/page.tsx` 수정사항 2가지:

**A) 본문 중간에 InlineSubscribeCTA 삽입**

본문 HTML(content)을 `</p>` 태그 기준으로 분할하여 50% 지점에 삽입.

```tsx
const paragraphs = content.split('</p>');
const showInline = paragraphs.length >= 5;
const midPoint = Math.floor(paragraphs.length / 2);
const firstHalf = paragraphs.slice(0, midPoint).join('</p>') + '</p>';
const secondHalf = paragraphs.slice(midPoint).join('</p>');
```

paragraph 5개 미만이면 InlineSubscribeCTA 미삽입 — 기존처럼 본문 통째로 렌더.

**B) NewsletterCTA 위치 변경**

현재: Related Posts 아래 (맨 끝)
변경: 댓글 다음, Previous/Next 앞으로 이동

```
본문 → 태그 → Back/Share → 댓글 → [NewsletterCTA 여기로] → Previous/Next → Related Posts
```

---

## 수정 대상 파일

| 파일 | 변경 |
|------|------|
| `components/NewsletterCTA.tsx` | 텍스트 + FREE 배지 + 성공 시 PDF 링크 |
| `components/InlineSubscribeCTA.tsx` | **신규** |
| `app/(public)/blog/[slug]/page.tsx` | InlineSubscribeCTA 삽입 + NewsletterCTA 위치 변경 |
| `app/api/subscribe/route.ts` | 중복 구독 시 existing 플래그 (필요시) |

**절대 수정 금지:** `components/carousel/*`, `app/mhj-desk/*`

---

## 디자인 규칙

- 인디고(#4F46E5) 절대 금지
- border-radius ≤ 12px
- MHJ 브랜드 갈색: #8A6B4F
- 배경: #FAF8F5 (cream)
- FREE 배지: bg #FEF3C7, color #92400E
- 모바일 반응형 필수

---

## 테스트

1. `npm run build` 통과
2. PDF 업로드 확인: `curl -sI "https://vpayqdatpqajsmalpfmq.supabase.co/storage/v1/object/public/images/lead-magnets/NZ_School_Starter_Pack.pdf" | head -1` → HTTP 200
3. 홈페이지: NewsletterCTA에 FREE 배지 + "NZ School Starter Pack" 표시
4. 블로그 상세 (긴 글): 본문 중간에 InlineSubscribeCTA 표시
5. 블로그 상세 (짧은 글): InlineSubscribeCTA 미표시
6. 이메일 구독 → 성공 → PDF 다운로드 링크 2개 표시
7. 이미 구독된 이메일 → "already subscribed" + PDF 링크 (에러가 아님)
8. NewsletterCTA 위치: 댓글 다음, Previous/Next 앞
9. 모바일 (375px): InlineSubscribeCTA 세로 레이아웃
10. PDF 링크 클릭 → 브라우저에서 PDF 열림
