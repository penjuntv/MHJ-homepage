# MHJ SEO Patch — 2026-05-30

> 4개 PR + 3개 Claude 스킬로 구성된 SEO/GEO/AEO 보강 패치.

## 무엇이 들었나

```
mhj-seo-patch-2026-05-30/
├── README.md                              ← 이 파일
├── PROMPTS.md                             ← Claude Code 4개 프롬프트
├── app/
│   ├── robots.ts                          (수정본 — A1)
│   ├── sitemap.ts                         (수정본 — A6)
│   ├── llms.txt/route.ts                  (신규 — A2)
│   └── llms-full.txt/route.ts             (신규 — A3)
├── patches/
│   └── storypress-faq-schema.md           (적용 가이드 — A4)
└── .claude/skills/
    ├── llms-txt-generator/SKILL.md        (B1)
    ├── seo-audit-runner/SKILL.md          (B2 — 가장 중요)
    └── internal-link-suggester/SKILL.md   (B3)
```

## 사용 순서

1. `PROMPTS.md` 열기
2. 새 Claude Code 세션 시작 (Sonnet, Plan Mode)
3. PR 1 프롬프트 복사 → 붙여넣기 → 승인 → 실행
4. 빌드 통과 + 푸시 후 다음 PR
5. PR 1 → 2 → 3 → 4 순서 엄수
6. 4개 PR 모두 머지 후 `PROMPTS.md` 의 "최종 점검 체크리스트" 실행

## 각 PR 영향 범위

| PR | 파일 수 | 빌드 영향 | 런타임 영향 |
|---|---|---|---|
| 1. robots.ts + sitemap.ts | 2 | 빌드 통과 필요 | sitemap fetch DB 부하 ↓, AI 봇 trafic ↑ 기대 |
| 2. llms.txt + llms-full.txt | 4 (신규 라우트) | 빌드 통과 필요 | 새 엔드포인트 2개 |
| 3. StoryPress FAQ schema | 3 (lib 신규 + 2개 수정) | 빌드 통과 필요 | UI 변화 없음, schema 추가만 |
| 4. .claude/skills | 5 (md 3 + skills-lock + AGENTS.md) | 빌드 영향 없음 | 런타임 영향 없음 |

## 안전 장치

- 모든 PR 은 `seo-patch-2026-05-30` 단일 브랜치 위에 쌓임
- 문제 발생 시 해당 커밋만 revert 가능 (4개 분리 커밋)
- 빌드 통과 후에만 푸시 (각 PR 의 작업 4에 명시)
- `.next` 캐시 클리어 명시 (메모리상 P-02 함정 회피)

## 적용 후 KPI 측정 (3개월)

| 지표 | 측정 도구 | 기대 변화 |
|---|---|---|
| GSC 색인된 페이지 수 | Search Console | 53 → 60+ (sitemap 정합성 향상) |
| GSC 노출 (impressions) | Search Console | 베이스라인 측정 → 추적 |
| AI 봇 fetch 빈도 | Vercel runtime log (`GPTBot|ClaudeBot|PerplexityBot`) | 새 발생 |
| llms.txt 응답 시간 | Vercel Speed Insights | < 200ms |
| FAQ rich result | Google Rich Results Test | 가능 |
| ChatGPT/Claude/Perplexity 인용 | 수동 ("What is MHJ?") | 6개월 시점 첫 인용 기대 |

## 의도적으로 제외한 것

검토 단계에서 효과 의심으로 제외:
- ItemList/CollectionPage schema (블로그 목록) — Google 활용 불투명
- schema-auditor 단독 스킬 — seo-audit-runner 에 흡수
- ai-crawler-policy 단독 스킬 — seo-audit-runner 에 흡수
- 콘텐츠 정비 자체 — **별도 세션 (Phase C)**. 이 패치는 인프라만.

## 한계 인정

- llms.txt 효과는 "보험" 성격. ChatGPT/Claude/Perplexity 의 실제 인용은 6~12개월 누적 데이터 필요.
- FAQ rich result 는 2026년 Google 노출 정책 축소로 SERP 노출 보장 안 됨. AEO 가치만 확보.
- Phase A 적용해도 **콘텐츠 자체 문제 (thin content 30편, H2 0개 52편)** 안 풀리면 색인·노출 정체.
  → 콘텐츠 정비가 진짜 lever. Phase C 필수.

---

*2026-05-30 by PeNnY + Claude. 라이브 적용 전 PROMPTS.md 정독.*
