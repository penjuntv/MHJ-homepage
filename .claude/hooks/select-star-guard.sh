#!/bin/bash
# select-star-guard — 공개 페이지 blogs select('*') 재발 차단 (PreToolUse: Edit|Write)
#
# 2026-09-04 P0 사고: 공개 페이지의 blogs select('*') 가 content_backup(아이 실명)·
# insight_kr 를 RSC flight 페이로드로 HTML 에 직렬화해 노출. 수정은 컬럼 화이트리스트
# (lib/constants.ts 의 BLOG_CARD_COLUMNS/BLOG_DETAIL_COLUMNS)였지만 opt-in 이라
# 다음 select('*') 하나가 사고를 재발시킨다. 이 훅이 그 한 줄을 결정론적으로 막는다.
# 짝: 주간 CI 쪽은 scripts/audit-select-star.mjs (site-audit.yml ⑧).
#
# 설계 (name-guard.sh 와 동일 강도의 fail-closed):
#   - 검사 범위는 app/(public)/** 만. admin(mhj-desk)·API·내부 렌더는 service_role
#     또는 비공개 표면이라 대상 아님.
#   - 새 텍스트에 select('*') 가 있고, 그 텍스트나 대상 파일이 from('blogs') 를
#     참조하면 → exit 2 (차단). 파일 단위 근사라 같은 파일의 다른 테이블
#     select('*') 추가도 걸릴 수 있다 — 그 경우도 명시 컬럼으로 쓰는 게 맞다.
#   - blogs 무관 파일의 select('*') 는 경고만 (매거진 등 기존 패턴 리팩터를 막지 않는다).
#   - 빈/누락 필드는 false-block 하지 않는다. stdin JSON 파싱 실패는 fail closed.

INPUT=$(cat)

if ! FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""' 2>&1); then
  echo "select-star-guard: stdin JSON 파싱 실패 — fail closed. jq: $FILE" >&2
  exit 2
fi
if ! TEXT=$(printf '%s' "$INPUT" | jq -r '(.tool_input.new_string // "") + "\n" + (.tool_input.content // "")' 2>&1); then
  echo "select-star-guard: stdin JSON 파싱 실패 — fail closed. jq: $TEXT" >&2
  exit 2
fi

[ -z "$FILE" ] && exit 0

REL="${FILE#"$PWD"/}"

# 공개 페이지 트리만 검사
case "$REL" in
  "app/(public)/"*) ;;
  *) exit 0 ;;
esac

# select('*') — 따옴표 3종·내부 공백 허용. select('*', { count }) 도 매치.
SELECT_STAR="select\\([[:space:]]*['\"\`][[:space:]]*\\*[[:space:]]*['\"\`]"
printf '%s' "$TEXT" | grep -qE "$SELECT_STAR" || exit 0

# blogs 연관 판정: 새 텍스트 또는 디스크의 대상 파일에 from('blogs')
FROM_BLOGS="from\\([[:space:]]*['\"\`]blogs['\"\`]"
BLOGS=0
printf '%s' "$TEXT" | grep -qE "$FROM_BLOGS" && BLOGS=1
[ "$BLOGS" = 0 ] && [ -f "$FILE" ] && grep -qE "$FROM_BLOGS" "$FILE" && BLOGS=1

if [ "$BLOGS" = 1 ]; then
  echo "🔴 select-star-guard BLOCKED: app/(public) 의 blogs 쿼리에 select('*') 금지 — $REL" >&2
  echo "content_backup·insight_kr 가 RSC 페이로드로 노출된다 (2026-09-04 P0 재발 방지)." >&2
  echo "lib/constants.ts 의 BLOG_CARD_COLUMNS / BLOG_DETAIL_COLUMNS 를 쓸 것." >&2
  echo "(이 파일이 blogs 를 참조해 파일 단위로 차단됨 — 다른 테이블이라도 명시 컬럼으로.)" >&2
  exit 2
fi

echo "⚠️ select-star-guard WARNING: app/(public) 에 select('*') 추가 감지 — $REL" >&2
echo "공개 표면에서는 명시 컬럼 목록이 안전하다. 비공개 컬럼이 있는 테이블이면 화이트리스트로." >&2
exit 0
