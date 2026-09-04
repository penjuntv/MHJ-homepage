#!/bin/bash
# select-star-guard 회귀 테스트 — 기대 exit 코드와 실제를 비교.
#
# 왜: 훅은 조용히 fail-open 이 되기 쉽다(경로 판정·jq 필드·정규식 어느 하나만 어긋나도
# 그냥 exit 0 이 된다). 훅이 "돌긴 도는데 아무것도 못 막는" 상태를 CI 가 잡게 한다.
# source-guard.yml 에서 audit-select-star.mjs 와 함께 돈다.
#
# 실행: bash scripts/qa/test-select-star-guard.sh   (repo 어디서 호출하든 무방)
# 주의: JSON 페이로드는 bash 이중따옴표로 감싼다 — JS 의 작은따옴표를 살리기 위해서다.
#       (홑따옴표로 감싸면 'blogs' 의 따옴표가 사라져 테스트가 조용히 무의미해진다.)
set -u
cd "$(dirname "$0")/../.." || exit 1
H=.claude/hooks/select-star-guard.sh
[ -f "$H" ] || { echo "FAIL: 훅 파일 없음 — $H"; exit 1; }
PASS=0; FAIL=0

run() { # $1=이름 $2=기대exit $3=json $4(선택)=raw → JSON 유효성 검사 생략
  local err rc
  err=$(printf '%s' "$3" | bash "$H" 2>&1); rc=$?
  # 페이로드가 실제로 유효 JSON 인지 자체 검증 — 셸 따옴표가 먹혀 테스트가
  # 조용히 무의미해지는 것을 막는다 (실제로 밟았던 함정).
  if [ "${4:-}" != raw ] && ! printf '%s' "$3" | jq -e . >/dev/null 2>&1; then
    echo "FAIL [$1] 테스트 페이로드가 유효 JSON 이 아님 — 셸 따옴표 확인"
    FAIL=$((FAIL+1)); return 0
  fi
  if [ "$rc" = "$2" ]; then PASS=$((PASS+1)); echo "PASS [$1] exit=$rc"
  else FAIL=$((FAIL+1)); echo "FAIL [$1] expected=$2 got=$rc"; fi
  [ -n "$err" ] && printf '%s\n' "$err" | sed 's/^/      /'
  return 0
}

run "1 공개 blogs select(*) 차단" 2 \
  "{\"tool_input\":{\"file_path\":\"app/(public)/blog/page.tsx\",\"new_string\":\"const { data } = await supabase.from('blogs').select('*').eq('published', true)\"}}"
run "2 admin blogs 통과" 0 \
  "{\"tool_input\":{\"file_path\":\"app/mhj-desk/blogs/page.tsx\",\"new_string\":\"supabase.from('blogs').select('*')\"}}"
run "3 공개 magazines 경고+통과" 0 \
  "{\"tool_input\":{\"file_path\":\"app/(public)/magazine/[id]/page.tsx\",\"new_string\":\"supabase.from('magazines').select('*').eq('id', id)\"}}"
run "4 화이트리스트 컬럼 통과" 0 \
  "{\"tool_input\":{\"file_path\":\"app/(public)/blog/page.tsx\",\"new_string\":\"supabase.from('blogs').select(BLOG_CARD_COLUMNS)\"}}"
run "5 절대경로+멀티라인 체인 차단" 2 \
  "{\"tool_input\":{\"file_path\":\"$PWD/app/feed.xml/route.ts\",\"content\":\"await supabase\n  .from('blogs')\n  .select(\n    '*'\n  )\"}}"
run "6 MultiEdit edits[] 차단" 2 \
  "{\"tool_input\":{\"file_path\":\"app/api/search/route.ts\",\"edits\":[{\"new_string\":\"const x = 1\"},{\"new_string\":\"supabase.from('blogs').select('*')\"}]}}"
run "7 체인없는 bare select(*) — blogs 파일이면 차단" 2 \
  "{\"tool_input\":{\"file_path\":\"app/(public)/blog/page.tsx\",\"new_string\":\"    .select('*')\"}}"
run "8 워크트리 절대경로 차단" 2 \
  "{\"tool_input\":{\"file_path\":\"$PWD/.claude/worktrees/x/app/(public)/blog/page.tsx\",\"new_string\":\"supabase.from('blogs').select('*')\"}}"
# 백틱은 bash 홑따옴표 안에서 리터럴 — JS 작은따옴표가 없는 케이스라 이 형태가 안전
run "9 백틱 따옴표 차단" 2 \
  '{"tool_input":{"file_path":"app/(public)/blog/page.tsx","new_string":"supabase.from(`blogs`).select(`*`)"}}'
# lib/·components/ 도 범위 안 — 공유 헬퍼로 빠져나가는 경로를 막는다
run "10 lib/ 공유 헬퍼 차단" 2 \
  "{\"tool_input\":{\"file_path\":\"lib/blog-queries.ts\",\"new_string\":\"supabase.from('blogs').select('*')\"}}"
run "10b components/ 차단" 2 \
  "{\"tool_input\":{\"file_path\":\"components/BlogLibrary.tsx\",\"new_string\":\"supabase.from('blogs').select('*')\"}}"
run "10c 범위 밖(scripts/) 통과" 0 \
  "{\"tool_input\":{\"file_path\":\"scripts/backfill.mjs\",\"new_string\":\"db.from('blogs').select('*')\"}}"
run "11 stdin JSON 파싱 실패 fail-closed" 2 'not json at all' raw
run "12 file_path 없음 통과" 0 "{\"tool_input\":{\"new_string\":\"x\"}}"
run "13 count head 용 select(id) 통과" 0 \
  "{\"tool_input\":{\"file_path\":\"app/(public)/media-kit/page.tsx\",\"new_string\":\"supabase.from('blogs').select('id', { count: 'exact', head: true })\"}}"
run "14 공백 낀 select( '*' ) 차단" 2 \
  "{\"tool_input\":{\"file_path\":\"app/(public)/blog/[slug]/page.tsx\",\"new_string\":\"supabase.from( 'blogs' ).select( ' * ' )\"}}"
# 존재하지 않는 경로 — 파일 내용 fallback 이 없을 때 bare select(*) 는 경고까지만
run "15 blogs 미참조 스니펫의 bare select(*) 경고+통과" 0 \
  "{\"tool_input\":{\"file_path\":\"app/(public)/__no_such_file__/page.tsx\",\"new_string\":\"    .select('*')\"}}"
run "16 신규 파일(Write) 화이트리스트 통과" 0 \
  "{\"tool_input\":{\"file_path\":\"app/(public)/__no_such_file__/page.tsx\",\"content\":\"supabase.from('blogs').select(BLOG_DETAIL_COLUMNS).eq('slug', slug)\"}}"

echo "----"
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" = 0 ]
