# Carousel V2 QA Pipeline
# 슬래시 커맨드: /workflows/carousel-qa
# Deep Think: ON
# 소요: ~8분

## Agent 1: Carousel Editor QA
- Skill: user-flow (커스텀)
- 대상: localhost:3003
- 시나리오:
  1. /mhj-desk 로그인
  2. 캐러셀 편집 진입
  3. 레이아웃 드롭다운 5개+ 순회
  4. Photo Panel: NZ Asset Library 사진 선택
  5. Text Panel: 제목/본문 수정
  6. Aspect ratio: 4:5 → 1:1 → 4:5
  7. 슬라이드 3장+ 추가
  8. 슬라이드 순서 변경
  9. 미리보기
  10. Export 시도
- Recording: ON, Deep Think: ON

## Agent 2: Mobile Breakpoint
- Skill: visual-qa
- 대상: localhost:3003 캐러셀 편집
- 뷰포트: 768, 375
- 집중: 1-column 전환, grid 깨짐, 터치 가능 여부

## Agent 3: Export Verification
- Skill: console-audit
- 대상: localhost:3003 캐러셀 편집
- 집중: Export 클릭 시 blob/dataURL/Supabase 응답/CORS/메모리

## 보고
- Export 성공/실패 최상단
- 모바일 grid 스크린샷 필수
- 깨지는 레이아웃 번호 명시
