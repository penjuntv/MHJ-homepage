#!/bin/bash
# select-star-guard — 공개 표면 blogs select('*') 재발 차단 (PreToolUse: Edit|Write|MultiEdit)
#
# 2026-09-04 P0 사고: 공개 페이지의 blogs select('*') 가 content_backup(아이 실명)·
# insight_kr 를 RSC flight 페이로드로 HTML 에 직렬화해 노출. 수정은 컬럼 화이트리스트
# (lib/constants.ts 의 BLOG_*_COLUMNS)였지만 opt-in 이라 다음 한 줄이 재발시킨다.
# 짝: CI 쪽은 scripts/audit-select-star.mjs (source-guard.yml + site-audit.yml ⑧).
#
# 설계 (name-guard.sh 의 fail-closed 원칙 + 리뷰 반영 강화):
#   - 범위: app/·lib/·components/ 에서 mhj-desk 만 제외. (public)뿐 아니라 feed.xml·
#     llms·sitemap·api/search 등 blogs 를 익명 응답으로 내보내는 표면 전부가 대상이고,
#     공유 데이터 접근 헬퍼가 lib/ 로 빠져도 뚫리지 않게 lib/·components/ 도 본다.
#     (CI 짝 scripts/audit-select-star.mjs 의 ROOTS 와 같은 범위를 유지할 것.)
#   - 경로 판정은 절대경로/워크트리 경로에도 매치되는 substring case — $PWD 스트립
#     실패가 fail-open 이 되지 않게 한다.
#   - MultiEdit 의 edits[].new_string 도 검사한다 (new_string/content 만 보면 no-op).
#   - 텍스트를 한 줄로 평탄화해 Prettier 줄바꿈(.select(\n '*'))도 잡는다.
#   - 쿼리 체인 단위 판정: .from( 마다 세그먼트를 끊어 blogs 세그먼트 안의 select('*')
#     만 차단 — 같은 파일/스니펫의 다른 테이블 select('*') 는 경고만.
#   - 체인 시작(.from)이 스니펫에 없는 bare select('*') 는 파일이 blogs 를 참조하면
#     차단(fail-closed). 오차단이면 편집 범위에 .from(...) 줄까지 포함해 재시도하면 된다.
#   - 빈/누락 필드는 false-block 하지 않는다. stdin JSON 파싱 실패는 fail closed.

INPUT=$(cat)

if ! FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""' 2>&1); then
  echo "select-star-guard: stdin JSON 파싱 실패 — fail closed. jq: $FILE" >&2
  exit 2
fi

[ -z "$FILE" ] && exit 0

# 경로 게이트 — 저장소 상대/절대/워크트리 어디서든 substring 으로 판정 (fail-closed)
case "$FILE" in
  *app/mhj-desk/*) exit 0 ;;               # admin: Supabase Auth 뒤, 대상 아님
  app/*|*/app/*) ;;                        # 공개 표면 후보 → 검사
  lib/*|*/lib/*) ;;                        # 공유 데이터 접근 헬퍼
  components/*|*/components/*) ;;          # 공개 페이지가 렌더하는 컴포넌트
  *) exit 0 ;;
esac

# Edit=new_string, Write=content, MultiEdit=edits[].new_string — 셋 다 검사.
if ! TEXT=$(printf '%s' "$INPUT" | jq -r '(.tool_input.new_string // "") + "\n" + (.tool_input.content // "") + "\n" + ([.tool_input.edits[]?.new_string // ""] | join("\n"))' 2>&1); then
  echo "select-star-guard: stdin JSON 파싱 실패 — fail closed. jq: $TEXT" >&2
  exit 2
fi

# 평탄화 — 멀티라인 체인/줄바꿈 select( 를 한 줄에서 매치
FLAT=$(printf '%s' "$TEXT" | tr '\n\t' '  ')

SELECT_STAR="select\\([[:space:]]*['\"\`][[:space:]]*\\*[[:space:]]*['\"\`]"
printf '%s' "$FLAT" | grep -qE "$SELECT_STAR" || exit 0

FROM_BLOGS="from\\([[:space:]]*['\"\`]blogs['\"\`]"

# 쿼리 체인 세그먼트: .from( 앞에서 줄을 끊으면 각 줄 = from~다음 from 직전.
SEGMENTS=$(printf '%s' "$FLAT" | sed -e 's/\.from(/\
.from(/g')

block() {
  echo "🔴 select-star-guard BLOCKED: 공개 표면의 blogs 쿼리에 select('*') 금지 — $FILE" >&2
  echo "content_backup·insight_kr 가 익명 응답으로 노출된다 (2026-09-04 P0 재발 방지)." >&2
  echo "lib/constants.ts 의 BLOG_CARD_COLUMNS / BLOG_DETAIL_COLUMNS 등 명시 컬럼을 쓸 것." >&2
  exit 2
}

# 1) 같은 체인 안에서 from('blogs') → select('*') : 확정 차단
if printf '%s' "$SEGMENTS" | grep -qE "^\\.${FROM_BLOGS}['\"\`]?[[:space:]]*\\).*${SELECT_STAR}"; then
  block
fi

# 2) select('*') 가 다른 테이블 체인에 속하면 경고만
if printf '%s' "$SEGMENTS" | grep -E "^\\.from\\(" | grep -vE "^\\.${FROM_BLOGS}" | grep -qE "$SELECT_STAR"; then
  echo "⚠️ select-star-guard WARNING: 공개 표면에 select('*') 추가 감지 — $FILE" >&2
  echo "blogs 는 아니지만, 비공개 컬럼이 있는 테이블이면 명시 컬럼 목록으로 쓸 것." >&2
fi

# 3) 체인 시작 없는 bare select('*') : 스니펫/파일이 blogs 를 참조하면 fail-closed 차단
if printf '%s' "$SEGMENTS" | grep -vE "^\\.from\\(" | grep -qE "$SELECT_STAR"; then
  if printf '%s' "$FLAT" | grep -qE "$FROM_BLOGS" || { [ -f "$FILE" ] && grep -qE "$FROM_BLOGS" "$FILE"; }; then
    echo "(bare select('*') — 이 파일이 blogs 를 참조해 보수적으로 차단. 오차단이면" >&2
    echo " 편집 범위에 해당 쿼리의 .from(...) 줄까지 포함해 테이블을 판별시킬 것.)" >&2
    block
  fi
  echo "⚠️ select-star-guard WARNING: 공개 표면에 select('*') 추가 감지 — $FILE" >&2
  echo "공개 표면에서는 명시 컬럼 목록이 안전하다." >&2
fi

exit 0
