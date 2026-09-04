#!/bin/bash
# name-guard — 아이 실명·구명 노출 차단 (PreToolUse: Edit|Write)
#
# CLAUDE.md 규칙 10: 아이 실명(유민/유현/유진 등)·"Heejong Jo" 노출은 P0.
# 사이트 표기는 Min/Hyun/Jin, PeNnY/Yussi 만 허용한다.
# fact-verify 스킬의 프롬프트 규칙을 결정론적 게이트로 승격한 것.
#
# 설계 (safety-gate.sh 의 fail-closed 원칙과 동일 강도):
#   - 차단이 기본값이다. 예외는 명시된 것뿐:
#       .claude/ .agents/ .codex/  → skip  (금칙 패턴 자체가 훅·스킬 문서에 존재)
#       docs/                      → 경고만 (옛 마이그레이션 SQL 에 옛 값이 합법적으로 존재)
#       그 외 전부 (app/ components/ lib/ seed-data/ public/ scratch/ *.sql …) → exit 2
#   - 빈/누락 필드는 절대 false-block 하지 않는다 (jq `// ""` 기본값).
#   - stdin JSON 파싱 실패는 fail closed (명시적 exit 2 — set -e 아님).

INPUT=$(cat)

if ! FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""' 2>&1); then
  echo "name-guard: stdin JSON 파싱 실패 — fail closed. jq: $FILE" >&2
  exit 2
fi
# Edit=new_string, Write=content, MultiEdit=edits[].new_string — 셋 다 검사.
if ! TEXT=$(printf '%s' "$INPUT" | jq -r '(.tool_input.new_string // "") + "\n" + (.tool_input.content // "") + "\n" + ([.tool_input.edits[]?.new_string // ""] | join("\n"))' 2>&1); then
  echo "name-guard: stdin JSON 파싱 실패 — fail closed. jq: $TEXT" >&2
  exit 2
fi

# 대상 경로가 없으면 판단 불가 — 차단하지 않는다
[ -z "$FILE" ] && exit 0

# 절대경로 → repo 상대경로 정규화
REL="${FILE#"$PWD"/}"

# 훅·스킬·타 에이전트 설정은 스킵 (이 파일 자신 포함)
case "$REL" in
  .claude/*|.agents/*|.codex/*) exit 0 ;;
esac

# 금칙어: 아이 실명(라틴/한글 표기) + 구명. 대소문자 무시.
PATTERN='yumin|yuhyeon|yuhyun|yujin|유민|유현|유진|heejong[[:space:]]+jo'
HIT=$(printf '%s' "$TEXT" | grep -ioE "$PATTERN" | sort -u | tr '\n' ' ')

if [ -n "$HIT" ]; then
  case "$REL" in
    docs/*)
      echo "⚠️ name-guard WARNING: 금칙 이름 감지 — ${HIT}(파일: $REL)" >&2
      echo "docs/ 는 통과시키지만, 새 문서에 실명을 추가하지 말 것 (CLAUDE.md 규칙 10)." >&2
      exit 0
      ;;
    *)
      echo "🔴 name-guard BLOCKED: 금칙 이름 감지 — ${HIT}(파일: $REL)" >&2
      echo "아이 실명(유민/유현/유진, Yumin/Yuhyeon/Yuhyun/Yujin)·'Heejong Jo' 는 P0." >&2
      echo "Min/Hyun/Jin, PeNnY/Yussi 로 표기할 것 (CLAUDE.md 규칙 10, fact-verify 절대 규칙)." >&2
      exit 2
      ;;
  esac
fi

exit 0
