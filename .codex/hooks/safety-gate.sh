#!/bin/bash
# MHJ Safety Gate — 위험 명령 차단
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

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
