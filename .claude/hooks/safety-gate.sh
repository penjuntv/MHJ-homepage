#!/bin/bash
# MHJ Safety Gate — 위험 명령 차단
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# 읽기 전용 검색은 통과시킨다.
# 아래 위험 패턴 매칭은 명령 문자열 전체를 훑기 때문에, 차단 리터럴을 '검색'하는
# grep/rg/git log 까지 같이 막혀서 코드 감사가 불가능했다.
if echo "$CMD" | grep -qE '^[[:space:]]*(grep|rg|git[[:space:]]+log)([[:space:]]|$)'; then
  exit 0
fi

# 위험 명령 패턴
if echo "$CMD" | grep -qiE '(rm -rf|DROP TABLE|DROP DATABASE|ALTER TABLE.*DROP|git push.*--force|git push.*-f )'; then
  echo "위험 명령 차단: $CMD" >&2
  exit 2
fi

# git add -A / --all / . 차단 (secrets/ephemeral 파일 실수 방지)
if echo "$CMD" | grep -qE 'git\s+add\s+(-A|-a|--all|\.)(\s|$)'; then
  echo "🔴 BLOCKED: 'git add -A/--all/.' is forbidden." >&2
  echo "Use explicit file paths or 'git add -p' for hunk-by-hunk review." >&2
  echo "Reason: Prevents accidental commits of secrets or ephemeral files." >&2
  exit 2
fi

exit 0
