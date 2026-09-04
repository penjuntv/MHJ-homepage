#!/bin/bash
# mag-unit-guard — 매거진 지면에 뷰포트 의존 CSS 단위가 들어오는 것을 차단 (PreToolUse: Edit|Write)
#
# 배경 (2026-08 리딩뷰 잘림 사고):
#   .mag-page-root 는 `container-type: inline-size` 다 → 가로(cqw)만 컨테이너 기준이 된다.
#   여기서 `38cqh` 를 쓰면 cqh 를 해석할 size 컨테이너가 없어 small viewport 로 폴백,
#   즉 38svh 로 동작한다. 실측: 창 높이 700/900/1080/1400 에서 이미지 max-height 가
#   266/342/410.4/532px — 정확히 창높이×0.38. 그 결과 같은 URL 이 브라우저 창 높이에 따라
#   잘리기도 안 잘리기도 했고, MagazineCanvas.tsx 가 보장한다고 적어 둔
#   "620×812 고정 캔버스 = 어떤 창에서도 픽셀 단위로 동일" 불변식이 깨졌다.
#
# 규칙:
#   1) components/magazine/ · app/globals.css  → 숫자+cqh 금지. 대신 calc(N * var(--mag-cqh)).
#   2) components/magazine/templates/          → 추가로 vh/dvh/svh/lvh/vw/dvw/svw/lvw 전면 금지.
#      템플릿은 고정 캔버스 안에서만 조판되어야 하며 뷰포트를 알아서는 안 된다.
#      (모바일 리플로우용 100vh 는 MagazineCanvas.tsx·MagazineSpreadViewer.tsx 에만 존재 — 허용)
#
# 설계는 name-guard.sh 와 동일: 파싱 실패 fail closed, 빈 필드는 false-block 하지 않음.

INPUT=$(cat)

if ! FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""' 2>&1); then
  echo "mag-unit-guard: stdin JSON 파싱 실패 — fail closed. jq: $FILE" >&2
  exit 2
fi
# Edit=new_string, Write=content, MultiEdit=edits[].new_string — 셋 다 검사.
if ! TEXT=$(printf '%s' "$INPUT" | jq -r '(.tool_input.new_string // "") + "\n" + (.tool_input.content // "") + "\n" + ([.tool_input.edits[]?.new_string // ""] | join("\n"))' 2>&1); then
  echo "mag-unit-guard: stdin JSON 파싱 실패 — fail closed. jq: $TEXT" >&2
  exit 2
fi

[ -z "$FILE" ] && exit 0
[ -z "$TEXT" ] && exit 0

# 절대경로 → repo 상대경로 정규화
REL="${FILE#"$PWD"/}"

# 훅·스킬·에이전트 설정은 스킵 (이 파일 자신이 금칙 패턴을 문서화하고 있다)
case "$REL" in
  .claude/*|.agents/*|.codex/*) exit 0 ;;
esac

IN_MAGAZINE=0
IN_TEMPLATES=0
case "$REL" in
  components/magazine/templates/*) IN_MAGAZINE=1; IN_TEMPLATES=1 ;;
  components/magazine/*|app/globals.css) IN_MAGAZINE=1 ;;
esac
[ "$IN_MAGAZINE" -eq 0 ] && exit 0

# ── 규칙 1: 숫자 + cqh ──
# `--mag-cqh` / `var(--mag-cqh)` 는 cqh 앞에 숫자가 없으므로 매치되지 않는다.
CQH=$(printf '%s' "$TEXT" | grep -oE '[0-9]+(\.[0-9]+)?cqh' | sort -u | tr '\n' ' ')
if [ -n "$CQH" ]; then
  echo "🔴 mag-unit-guard BLOCKED: 뷰포트로 폴백되는 cqh 사용 — ${CQH}(파일: $REL)" >&2
  echo ".mag-page-root 는 container-type: inline-size 라 cqh 에 매칭되는 컨테이너가 없다." >&2
  echo "→ small viewport 로 폴백해 창 높이마다 지면 분량이 달라진다(2026-08 잘림 사고)." >&2
  echo "대신: max-height: calc(38 * var(--mag-cqh))   # 지면 높이의 38%" >&2
  echo "정의는 app/globals.css 의 --mag-cqh 주석 참고." >&2
  exit 2
fi

# ── 규칙 2: 템플릿 안의 뷰포트 단위 ──
if [ "$IN_TEMPLATES" -eq 1 ]; then
  VP=$(printf '%s' "$TEXT" | grep -oE '[0-9]+(\.[0-9]+)?(dvh|svh|lvh|vh|dvw|svw|lvw|vw)\b' | sort -u | tr '\n' ' ')
  if [ -n "$VP" ]; then
    echo "🔴 mag-unit-guard BLOCKED: 템플릿 안에 뷰포트 단위 — ${VP}(파일: $REL)" >&2
    echo "매거진 템플릿은 620×812 고정 캔버스 안에서만 조판되어야 한다(뷰포트를 알면 안 됨)." >&2
    echo "가로 비례는 cqw, 세로 비례는 calc(N * var(--mag-cqh)) 를 쓸 것." >&2
    echo "모바일 리플로우용 100vh 는 MagazineCanvas.tsx·MagazineSpreadViewer.tsx 에만 둔다." >&2
    exit 2
  fi
fi

exit 0
