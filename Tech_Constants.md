# MHJ HOMEPAGE — Tech Constants

프로젝트 기술 상수 및 규칙 참조.

---

## Supabase

**클라이언트 초기화**:
- `/mhj-desk` 하위 컴포넌트(클라이언트 컴포넌트)는 전부 `lib/supabase-browser.ts`의 `createBrowserClient` 사용
- **공개 페이지** (`app/(public)/**`)에서 service_role 필요 시 → `createPublicAdminClient()` 사용. `createAdminClient()`를 쓰면 ISR 강등 발생 (`Common_Pitfalls.md` P-27 참조).
- **admin UI** (`app/mhj-desk/**`)와 **API route** (`app/api/**`)에서만 `createAdminClient()` 사용.
- **`draftMode()` preview 분기**는 예외 — 항상 최신이어야 하므로 공개 페이지에서도 `createAdminClient()` 사용 OK.

---

## 갱신 체크리스트

- [ ] Supabase 클라이언트 분기 규칙 변경 (createAdminClient vs createPublicAdminClient)
