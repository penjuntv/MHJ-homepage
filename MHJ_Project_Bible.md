# MHJ Project Bible

MHJ HOMEPAGE 프로젝트 전략 문서.

---

## 📋 백로그

| 작업 | 우선순위 |
|------|----------|
| RLS 정책 정비 (newsletters/subscribers anon SELECT) — admin client 의존성 제거 | 🟡 Phase 2 |
| 홈 13개 쿼리 통합 + SELECT * 정리 | 🟢 |
| /blog searchParams 제거 → 정적 라우트화 (페이지네이션·카테고리) | 🟢 |

---

## 변경 이력

- 2026-05-04: ISR 캐싱 강등 문제 수정 (홈 TTFB 5-7초 → 0.1-0.3초). `createPublicAdminClient` 신규 도입. P-27 학습 기록.
