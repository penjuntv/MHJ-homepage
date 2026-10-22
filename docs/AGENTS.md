# MHJ HOMEPAGE — 에이전트 역할 정의

## 🎯 리더 (Leader)
- 역할: 작업 계획 수립, 서브에이전트에 분배, 결과 통합
- 권한: 모든 파일 읽기, 최종 검증
- 행동 규칙:
  - 작업 시작 시 반드시 CLAUDE.md 읽기 + `git log -5` 로 맥락 파악
  - 큰 작업은 Plan Mode로 계획 먼저 세우고 사용자 승인 후 실행
  - 서브에이전트에 넘길 때 "읽어야 할 파일"과 "구체적 산출물"을 명시
  - 서브에이전트 결과를 검증 후 커밋

## 💻 코드 전문가 (Code Expert)
- 역할: 기능 구현, 버그 수정, API 연동, DB 작업
- 읽어야 할 문서: docs/ARCHITECTURE.md, docs/DB_SCHEMA.md
- 행동 규칙:
  - 새 파일 생성 시 기존 패턴(import 경로, 컴포넌트 구조) 먼저 확인
  - 캐싱: 공개 읽기는 ISR 허용(`supabase`/`createPublicAdminClient`) + 발행 시 revalidate. `no-store`는 예약발행·admin·유저별에만 (CLAUDE.md 규칙2 참조 — "모든 fetch no-store"는 폐기)
  - Admin(`app/mhj-desk/`) 기능 추가 시 → public 페이지 연동까지 완료해야 "끝"
  - npm run build 통과 필수
  - TypeScript strict 모드 준수

## 🎨 비주얼 디렉터 (Visual Director)
- 역할: UI/디자인 구현, 레이아웃 조정, 반응형, 다크 모드
- 읽어야 할 문서: docs/DESIGN_RULES.md, docs/DESIGN_SYSTEM.md
- 행동 규칙:
  - 변경 전 DESIGN_RULES.md를 반드시 읽기
  - CSS 변수 사용 (하드코딩 금지)
  - radius 12px, hover는 opacity/scale만
  - 8px 그리드 간격 준수
  - 변경 후 데스크탑(1320px+) + 태블릿(768px) + 모바일(375px) 3화면 확인
  - Playwright로 before/after 스크린샷 촬영

## 사용 시나리오

### 단순 작업 (버그 수정, 작은 기능 추가)
→ 리더가 직접 처리 (서브에이전트 불필요)

### 중간 작업 (새 페이지 추가)
→ 리더가 계획 → 코드 전문가가 구현 → 비주얼 디렉터가 디자인 검증

### 복잡한 작업 (전체 레이아웃 리밸런싱)
→ 리더가 계획 수립
→ 비주얼 디렉터가 Playwright로 현재 상태 스크린샷
→ 코드 전문가가 코드 수정
→ 비주얼 디렉터가 수정 후 스크린샷 비교
→ 리더가 최종 검증

---

## 스킬 목록

`.claude/skills/` · `.agents/skills/` 에 등록된 스킬 인벤토리. 추가 시 이 표 갱신.

| 스킬 | 추가 일자 | 용도 |
|---|---|---|
| yussi-factory | 2026-03-24 | 유씨팩토리 인포블록 생산 파이프라인 |
| blog-publish-preflight | 2026-03-24 | 블로그 발행 전 품질 체크 |
| design-rules-audit | 2026-03-24 | DESIGN_RULES 위반 검출 |
| cc-prompt-gen | 2026-03-24 | Claude Code 프롬프트 4섹션 자동 생성 |
| newsletter-composer | 2026-03-24 | Mairangi Notes 7섹션 조립 |
| frontend-design | 2026-05-03 | 프론트엔드 디자인 가이드 |
| llms-txt-generator | 2026-05-30 | /llms.txt 동적 라우트 점검·검증 |
| seo-audit-runner | 2026-05-30 | 발행 콘텐츠 SEO 감사 보고서 자동 생성 |
| internal-link-suggester | 2026-05-30 | 발행 시 내부 링크 후보 추천 |
| fact-verify | 2026-06-27 | 발행 전 사실 검증 게이트 (원본 `.agents/skills/`, `.claude/skills/` 는 심볼릭 링크) |
| verify | 2026-09-11 | 로컬 실행·실측 레시피 — 워크트리 셋업, 서버 기동 패턴, 매거진 네 갈래·fixture, 하면 안 되는 것(`/verify` 용) |
| llm-council | 2026-10-22 | 큰 결정을 자문역 5명 → 익명 상호 평가 → 의장 판결로 압박 테스트. 서브에이전트 11회. 기록은 `docs/decisions/` |
| grilling | 2026-10-22 | 작업 전 범위·의도 합의 인터뷰 — 질문마다 추천 답, 사실은 직접 조회, 합의 요약 확인 전 실행 금지 |
| grill-me | 2026-10-22 | `/grill-me` 로 grilling 을 직접 부르는 얇은 래퍼(모델 자동 호출 꺼짐) |
| diagnosing-bugs | 2026-10-22 | 어려운 버그·성능 저하 진단 — "빨갛게 되는 명령"부터 만들고 가설 3~5개 → 계측 → 회귀 테스트(`scripts/qa/test-*.mjs`) |
| skill-inspector | 2026-10-22 | 외부 스킬 들이기 전 안전 검사 — SkillSpector 정적 검사(커밋 고정 uvx, `--no-llm`) + 원문 의미 검토 → APPROVE/CAUTION/REJECT, 들이기 절차 |
| copywriting | 2026-10-22 | "보이는데 안 눌린다" 처방 — seo_title·메타 설명·구독 문구·CTA·About. 사실 날조·Yussi 본문 재작성 금지, 반영은 승인 뒤 |
| ai-seo | 2026-10-22 | AI 답변 인용 — 끝난 기반(llms.txt·스키마·Bing) 재작업 금지, 질문 묶음 → 누가 인용되나 → 꺼내기 쉽게 → 재측정 |
| referrals | 2026-10-22 | 1:1 전달 설계 — 전달 계기·복사용 문안·UTM(`direct_share`)·측정. 보상형 추천·제휴는 맞지 않음 |
| social | 2026-10-22 | 자체 채널 게시물 — 도달 실측에서 출발(유튜브 → 넘겨지는 카드 → 스레드 시험 → 인스타), 후크·AI 티·개인정보 점검 |

### 위치 규칙
- **원본이 `.agents/skills/` 인 스킬**: frontend-design · fact-verify. `.claude/skills/` 쪽은 심볼릭 링크(git mode 120000)다 — 원본을 지우면 링크가 전부 깨진다.
- **외부 스킬 들이기 전**: `skill-inspector` 로 검사부터. 절차는 그 스킬 끝 "MHJ 스킬 들이기 절차".
- **외부 출처 스킬**: copywriting · ai-seo · referrals · social 은 `coreyhaines31/marketingskills`(MIT, 커밋 e85f3cb), skill-inspector 는 `NVIDIA/SkillSpector`(Apache-2.0, 커밋 11c8b48)의 한국어·MHJ 맞춤본이다. grilling · grill-me · diagnosing-bugs 는 `mattpocock/skills`(MIT, 커밋 5beb35b)의 한국어·MHJ 맞춤 번역본이다. 각 폴더의 `UPSTREAM-LICENSE` 를 지우지 말 것(MIT 고지 의무). 자동 업데이트하지 않는다 — 원본이 바뀌어도 검토 후 손으로 반영한다. llm-council 은 원본(Karpathy·Ole Lehmann)에 라이선스가 없어 문구 없이 방법론만 가져와 새로 썼다.
- **Codex 변형본**: `.agents/skills/cc-prompt-gen` · `.agents/skills/llms-txt-generator` 는 `.claude/skills/` 의 동명 스킬을 Codex 용으로 문구만 치환("Claude Code"→"Codex")한 별도 사본이다. 내용을 고치면 양쪽 다 갱신할 것.
