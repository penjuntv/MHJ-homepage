#!/usr/bin/env bash
# 사람이 끼는(HITL) 재현 루프.
# 원본: mattpocock/skills — skills/engineering/diagnosing-bugs/scripts/hitl-loop.template.sh
#       (커밋 5beb35b, MIT, Copyright (c) 2026 Matt Pocock — ../UPSTREAM-LICENSE). 한국어 번역 + MHJ 예시.
#
# 이 파일을 복사해서(scratchpad 등) 아래 단계를 고친 뒤 실행한다.
# 에이전트가 스크립트를 돌리고, 사용자는 자기 터미널에서 안내를 따른다.
#
# 사용법:
#   bash hitl-loop.template.sh
#
# 도우미 두 개:
#   step "<안내>"            → 안내를 보여주고 Enter 를 기다린다
#   capture 변수 "<질문>"     → 질문을 보여주고 답을 변수에 담는다
#
# 끝에 담긴 값을 KEY=VALUE 로 출력한다. 에이전트가 이것을 읽는다.
#
# `capture` 는 값을 터미널에 다시 찍고 에이전트가 그것을 읽는다.
# 그러니 관찰한 것만 capture 하고, 로그인은 사용자에게 `step` 으로 맡긴다.
# (비밀번호·코드·이메일을 capture 로 받지 말 것)

set -euo pipefail

step() {
  printf '\n>>> %s\n' "$1"
  read -r -p "    [끝나면 Enter] " _
}

capture() {
  local var="$1" question="$2" answer
  printf '\n>>> %s\n' "$question"
  read -r -p "    > " answer
  printf -v "$var" '%s' "$answer"
}

# --- 여기부터 고친다 -----------------------------------------------------

step "http://localhost:3003/mhj-desk 를 열고 로그인하세요 (MFA 포함)."

capture ERRORED "블로그 목록에서 '저장' 버튼을 누르세요. 에러가 났나요? (y/n)"

capture ERROR_MSG "에러 메시지를 붙여 넣으세요 (없으면 'none'):"

# --- 여기까지 고친다 -----------------------------------------------------

printf '\n--- 수집 결과 ---\n'
printf 'ERRORED=%s\n' "$ERRORED"
printf 'ERROR_MSG=%s\n' "$ERROR_MSG"
