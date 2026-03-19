# MHJ HOMEPAGE — MY MAIRANGI JOURNAL

## 정체성
뉴질랜드 오클랜드 마이랑이 베이 한국인 가족의 라이프 매거진 웹사이트.
"따뜻하되 세련된, 감성적이되 지적인" 에디토리얼 톤.
운영자: PeNnY(조상목, 기자 출신) + Yussi(유희종, 사회복지학 석사) + 세 딸(유민/유현/유진)

## 기술 스택
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (DB+Storage+Auth) · TipTap · Resend · Vercel
개발 서버: localhost:3003 고정

## 핵심 규칙 (모든 작업에 적용)
1. 코드 수정 전 반드시 `docs/DESIGN_RULES.md` 읽기 (디자인 변경 시)
2. DB 스키마 변경 전 `docs/DB_SCHEMA.md` 확인
3. 새 컴포넌트 추가 시 `docs/ARCHITECTURE.md`의 패턴 따르기
4. cache: 'no-store' — 모든 Supabase fetch에 적용
5. TipTap — immediatelyRender: false 필수
6. 다크 모드 — CSS 변수 사용 (하드코딩 금지)
7. 호버 효과 — translateY 금지, opacity/미세 scale만
8. 카드 radius — 12px (32-50px 절대 금지)
9. Admin UI 변경 시 → 반드시 public 페이지 연동 확인
10. 단일 quotes in SQL → 이중 quotes('')로 이스케이프

## 참조 문서 (필요할 때만 읽기)
| 문서 | 경로 | 언제 읽나 |
|------|------|-----------|
| 디자인 규칙 | `docs/DESIGN_RULES.md` | UI/디자인 작업 시 |
| 디자인 토큰 | `docs/DESIGN_SYSTEM.md` | 색상/폰트/간격 참조 시 |
| 아키텍처 | `docs/ARCHITECTURE.md` | 새 페이지/컴포넌트 추가 시 |
| DB 스키마 | `docs/DB_SCHEMA.md` | DB 관련 작업 시 |
| 에이전트 역할 | `docs/AGENTS.md` | 복잡한 작업 시작 시 |
| 워크플로우 | `docs/WORKFLOW.md` | 작업 순서/규칙 확인 시 |

## 현재 상태 스냅샷
- 블로그 22개, 매거진 5+1개, 아티클 19개, 갤러리 60개
- 라이브: mhj-homepage.vercel.app
- GitHub: penjuntv/MHJ-homepage
- Supabase 프로젝트: vpayqdatpqajsmalpfmq

## 작업 규칙
- 1대화 = 1기능 (여러 기능 섞지 않기)
- 작업 시작 전 todo.md 확인
- 작업 완료 후 todo.md 업데이트
- npm run build 성공 확인 후 커밋
