# MHJ — Antigravity Agent Rules

> 이 문서는 Antigravity 에이전트가 자동 로드합니다.
> Claude Code의 `.claude/` 와는 별개입니다.

## 🚫 절대 금지 (어떤 에이전트도 예외 없음)

- 파일 생성·수정·삭제 금지
- git commit, git push, git checkout 금지
- npm install, npm run build, npm run dev 금지
- Supabase DDL/DML 실행 금지
- Vercel 환경변수·배포 설정 변경 금지
- /mhj-desk 에서 데이터 저장·삭제 금지 (읽기·탐색만 허용)
- 코드 변경 제안(Files Modified/Files With Changes) 금지 — 보고서에 텍스트로만 기술
- Accept/Reject 선택지를 만드는 어떤 행위도 금지


## ✅ 허용된 작업

- 브라우저 탐색: 클릭, 스크롤, 입력(검색·필터만), 뒤로가기
- 스크린샷 캡처 (자동/수동)
- 브라우저 세션 녹화
- Console 로그 읽기
- DOM 캡처 → Markdown 변환
- Visual regression 비교 (스크린샷 대조)
- Network 탭 응답 코드 확인

## 🎯 검수 대상

| 환경 | URL | 용도 |
|------|-----|------|
| Dev | http://localhost:3003 | Claude Code 작업 결과 검증 |
| Production | https://www.mhj.nz | 배포 후 최종 확인 + baseline |

## 📋 보고 형식

모든 결과는 Walkthrough Artifact로 출력:
- 문제별 스크린샷 첨부 필수
- Severity: P0(사용 불가) / P1(기능 결함) / P2(디자인 위반) / P3(개선 제안)
- 각 항목에 CSS selector 또는 페이지 경로 명시

## 🏠 MHJ 디자인 규칙 요약

- 콘텐츠 max-width: 1320px / 본문: 720px
- border-radius ≤ 12px (블로그 카드 6px, 32px+ 금지)
- hover: opacity 또는 scale(1.02~1.03)만 — translateY 금지, saturate() 금지
- heading cap: 72px
- 8px 그리드
- achromatic 팔레트 — 인디고(#4F46E5)는 AI Insight 전용
- 카드 위 텍스트 오버레이 금지
- 블로그 카드: 16:10 landscape / 매거진 카드: 3:4 portrait
- 배경: #FAF8F5 / 브랜드 브라운: #8A6B4F (dark: #C9A882)
- 폰트: Playfair Display(헤딩), Inter, Noto Sans KR

## 👨‍👩‍👧‍👦 프라이버시 규칙

- 사이트 표기: PeNnY, Yussi, Min, Hyun, Jin만 사용
- 아이 실명(유민/유현/유진/Yumin/Yuhyeon/Yujin) 노출 = P0 즉시 보고
- "Heejong Jo" 표기 = P0 즉시 보고
- 메타데이터(OG, alt, title)에 아이 실명 포함 여부 반드시 체크
