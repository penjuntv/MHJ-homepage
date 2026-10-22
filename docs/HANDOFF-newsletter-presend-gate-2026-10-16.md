# HANDOFF — 뉴스레터 발송 전 게이트 (2026-10-16, Claude Cowork)

## 원인 (#27)
- `app/mhj-desk/newsletter/new/page.tsx` 의 `issueDate` 기본값이 **폼을 연 날(브라우저 로컬 날짜)** 이다. #27 초안은 10/15(목)에 만들어져 `2026.10.15`가 저장됐고, 발송(10/16 15:32 NZDT) 때 아무도 대조하지 않았다.
- 메일 머리(템플릿 `issueDate`)에는 이 값이 그대로 찍힌다. 홈페이지 아카이브(`/mairangi-notes`)는 `sent_at`을 표시하므로 날짜가 메일과 홈페이지에서 다르게 보인다.
- 발송 API는 발송 순간 DB 필드로 HTML을 다시 렌더한다. 편집자가 본 미리보기와 실제 발송본이 같은지 대조하는 장치가 없었다.

## 패치 `docs/PATCH-newsletter-presend-gate-2026-10-16.patch` (적용 안 함 — 편집자 승인 후 적용·배포)
- `lib/newsletter-presend.ts` 신규: 전체 발송 직전 서버 게이트
  1. `issue_date` == 발송 순간의 뉴질랜드 날짜(YYYY.MM.DD)
  2. 프리헤더 빈칸·임시값 금지
  3. Local Guide 빈 카드 칸·제목/본문 누락 금지
  4. 승인 해시: 테스트 메일로 확인한 서버 렌더 HTML 해시 == 지금 발송할 HTML 해시 (확인 뒤 수정하면 막힘)
  - 실패 시 409 + 사유 목록. 발송·DB 상태 변경 없음.
- `app/api/send-newsletter/route.ts`: 게이트 호출, 응답에 `content_hash` 추가.
- `app/mhj-desk/newsletter/new/page.tsx`: 발행일 기본값 = 다가오는 금요일(NZ). 테스트 발송 결과 해시를 저장해 전체 발송에 `approved_hash`로 전달. 테스트 발송 없이 전체 발송 불가.
- DB 스키마 변경 없음. 자동 발송 없음. 편집자 승인(테스트 메일 확인 + 확인창) 유지.

## 검증
- `git apply --check` 통과. 복사본에서 `npx tsc --noEmit` 오류 0.
- `npx tsx scripts/presend-selftest.ts`: #27 실제 발송본 → 발행일 불일치 1건 차단 / 10/16 13:56 초안 → 3건 차단 / 정상 → 0건 / 승인 후 수정 → 차단 / NZ 자정 경계 정상.

## 적용
`git apply docs/PATCH-newsletter-presend-gate-2026-10-16.patch` → 로컬 확인 → 커밋·배포는 PeNnY.
