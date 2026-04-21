# Claude Code 설정 감사 — 2026-04-22

**작성일:** 2026-04-22  
**작업 범위:** CLAUDE.md 정비 + safety-gate.sh 패턴 교정 + settings.local.json 정리  
**세션 코드:** C안 (STEP 3-① ~ STEP 5)

---

## 1. 작업 배경

누적된 Claude Code 설정 파일들이 stale 항목, 보안 위험 항목, 중복 항목을 포함하고 있어
전면 감사 및 정리 진행. 코드베이스 변경 없음 — 설정/문서 파일만 수정.

---

## 2. 변경 파일 목록

| # | 파일 | 유형 | 내용 |
|---|------|------|------|
| 1 | `CLAUDE.md` | 수정 | 기술 스택 Gemini 추가, Admin 경로 명시, 숫자 날짜 주석 추가 |
| 2 | `.claude/hooks/safety-gate.sh` | 수정 | `--force` 차단 범위 축소 |
| 3 | `.claude/settings.local.json` | 수정 | 보안 위험 항목 삭제 + 스테일 35건 제거 |

---

## 3. 완료 테이블

### STEP 3-① CLAUDE.md 핵심 규칙 Admin 경로 추가

| 항목 | 내용 |
|------|------|
| 추가 위치 | `## 핵심 규칙` 섹션, 기존 "Admin UI 변경 시" 항목 바로 위 |
| 추가 내용 | `9. Admin UI 경로: app/mhj-desk/ (코드베이스 내 실제 디렉토리 기준)` |
| 기존 항목 번호 | 9번이었던 "Admin UI 변경 시 →" 항목은 10번으로 밀림 |

### STEP 3-② CLAUDE.md 기술 스택 Gemini 추가

| 항목 | 내용 |
|------|------|
| 패키지 확인 | `@google/generative-ai: "^0.24.1"` (package.json 실측) |
| 추가 내용 | `AI: @google/generative-ai (Gemini 2.0 Flash) — AI Insight 감상평 생성 + Carousel 텍스트 분석` |
| 추가 위치 | `## 기술 스택` 섹션 마지막 줄 |
| 백업 | `CLAUDE.md.bak` |

### STEP 3-③ CLAUDE.md 현재 상태 숫자 stale 처리

| 항목 | 내용 |
|------|------|
| 대상 줄 | `- 블로그 22개, 매거진 5+1개, 아티클 19개, 갤러리 60개` |
| 처리 방식 | 줄 끝에 `(2026-03 기준)` 주석 추가 (숫자 유지, stale 표시) |
| 판단 근거 | DB 실수치 확인 없이 삭제 시 정보 손실 우려 → 주석으로 경고 |

### STEP 4 safety-gate.sh `--force` 범위 축소

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 차단 패턴 | `--force` (모든 명령에 적용) | `git push.*--force` 또는 `git push.*-f ` |
| 부작용 해소 | `npm install --force`, `npx --force` 등 무해한 명령도 차단되던 문제 수정 | |
| 여전히 차단 | `rm -rf`, `DROP TABLE`, `DROP DATABASE`, `ALTER TABLE.*DROP` | 유지 |

### STEP 5 settings.local.json 정리

| 분류 | 삭제 건수 | 주요 내용 |
|------|-----------|-----------|
| 🔴 보안 위험 | 3건 | `ORIG_SERVICE_ROLE_KEY=eyJ...` Supabase 서비스 롤 JWT 평문 노출 |
| 🗑️ 인라인 데이터 | 1건 | framer-blogs.json 마이그레이션 heredoc (블로그 20개 본문 데이터) |
| 🗑️ 타 프로젝트 잔해 | 1건 | `mhj-storypress` 경로 참조 |
| 🗑️ PID 하드코딩 | 3건 | `kill 3811`, `kill 60415`, `ps -p 3811` |
| 🗑️ 일회성 경로 | 2건 | git add 하드코딩 파일 목록, find blog/[slug] |
| 🗑️ 디버그 잔해 | 2건 | `printf "EXIT=%d"`, `bash -x scope-guard.sh` |
| 🗑️ 파손 항목 | 2건 | `grep '""@supabase/...""`  (따옴표 이중 이스케이프) |
| 🗑️ 일회성 빌드 | 1건 | `NEXT_PRIVATE_DEBUG_CACHE=1 npx next build` |
| 🗑️ 일회성 파일 작업 | 9건 | Playwright Singleton rm ×3, 폰트 unzip/cp ×6 |
| 🗑️ 특정 쿼리 | 2건 | `/usr/bin/grep -oE 'href="/magazine/...'` |
| 🔀 중복 제거 | 9건 | `mcp__plugin_playwright_playwright__*` 구 이름 → `mcp__playwright__*` 현재 이름 유지 |
| **합계** | **35건 삭제** | 171건 → **136건** |

---

## 4. 검증 결과

| 검증 항목 | 결과 |
|-----------|------|
| settings.local.json JSON 파싱 | ✅ 정상 |
| 서비스 키 잔재 | ✅ 0건 (완전 제거) |
| 구 playwright 잔재 | ✅ 0건 (완전 제거) |
| session-summary.sh 존재 여부 | ✅ `.claude/hooks/`에 실존, settings.json Stop 훅과 일치 |
| safety-gate.sh 변경 후 문법 | ✅ bash 문법 오류 없음 |

---

## 5. 백업 파일 위치

| 파일 | 백업 경로 |
|------|-----------|
| `CLAUDE.md` | `CLAUDE.md.bak` (프로젝트 루트) |
| `.claude/settings.local.json` | `.claude/settings.local.json.bak` |

---

## 6. 되돌리기 방법

### CLAUDE.md 되돌리기
```bash
cp CLAUDE.md.bak CLAUDE.md
```

### settings.local.json 되돌리기
```bash
cp .claude/settings.local.json.bak .claude/settings.local.json
```

### safety-gate.sh 되돌리기 (--force 패턴 원복)

`--force` 차단을 전체 범위로 되돌리려면 `.claude/hooks/safety-gate.sh` 7번째 줄을:
```bash
# 현재 (축소 후)
if echo "$CMD" | grep -qiE '(rm -rf|DROP TABLE|DROP DATABASE|ALTER TABLE.*DROP|git push.*--force|git push.*-f )'; then

# 원래 (축소 전)
if echo "$CMD" | grep -qiE '(rm -rf|DROP TABLE|DROP DATABASE|ALTER TABLE.*DROP|--force)'; then
```

---

## 7. 후속 권고사항

| 우선순위 | 항목 | 이유 |
|----------|------|------|
| 🔴 높음 | 구 Supabase 프로젝트(`asatbuonduelfrhdkwgu`) 서비스 키 교체 고려 | 삭제된 JWT가 allow 목록에 평문으로 노출된 기간 동안 git 이력에 남아 있을 수 있음 |
| 🟡 중간 | `CLAUDE.md` 현재 상태 숫자 DB 실측 후 업데이트 | 현재 `(2026-03 기준)` 주석 상태 |
| 🟡 중간 | `settings.local.json` 향후 wildcard 패턴 우선 사용 | 특정 경로 하드코딩 대신 `Bash(kill:*)` 형태 선호 |
| 🟢 낮음 | `CLAUDE.md.bak` / `settings.local.json.bak` 정리 | 다음 세션 시작 전 git ignore 또는 삭제 |
