# im-not-ai(humanize-korean) 비교 시험 — 2026-10-22

**결론: 지금은 들이지 않는다(보류).** `mhj-voice-polish` 와는 겹치지 않는다. 한국어 AI 초안을 다듬는 빈자리는 실제로 있다.
그런데 우리 한국어 AI 초안은 이미 AI 티가 거의 없었다(위험 점수 0~3). 그래서 무거운 파이프라인을 들일 만큼의 효과가 지금은 안 보인다.

## 대상
- 저장소: `epoko77-ai/im-not-ai` @ `b37e020` (MIT, 별 6.2천). 스킬 `humanize-korean` v2.3.2.
- 시험 글: `docs/kit-1b-kakao-2026-09-22.txt` 의 한국어 페이스북 캡션(메시지 7)·인스타 캡션(메시지 10). Claude 가 쓴 공개용 문구다.

## 안전 검사 (`skill-inspector`)
| 범위 | SkillSpector 점수 | 판단 |
|---|---|---|
| 저장소 전체 | 100 · CRITICAL · DO_NOT_INSTALL | HIGH 15건 전부 오탐: 테스트의 임시 HOME 환경변수 복사, 경고만 하는 opt-in 커밋 훅, API 스펙 문서의 `DELETE` 줄 |
| `skills/humanize-korean/` | 64 · HIGH | "analysis-evasion" 2건 = 스캐너가 `diagnosis-rules.md` 를 파싱 한도로 끝까지 못 읽음. 직접 읽어 확인 |
| 런타임 스크립트·에이전트 프롬프트 | — | 네트워크·subprocess·환경변수 접근 0. 프롬프트 주입 방어 문구 있음 |

판정: **CAUTION**. 악성 신호는 없다. 다만 Python 스크립트 실행과 Opus 에이전트 3종을 쓰고, 현재 폴더(repo 루트)에 `_workspace/` 를 만든다.

## 결과
| | im-not-ai (light 경로, 보수) | mhj-voice-polish |
|---|---|---|
| 출력 언어 | 한국어 그대로 | **NZ 영어로 옮김** (설계 목적) |
| 페북 캡션 | 쉼표 2개만 뺌(C-11, 연결어미 뒤 쉼표). 변경률 0.4%, 게이트 OK | 영어 번역 + 표시만(일반론 도입·요약형 결말) |
| 인스타 캡션 | 고칠 근거 없음 → 원문 그대로. 변경률 0% | 영어 번역 + 표시만(목록 형태·같은 길이 줄) |
| 사전 위험 점수 | 3 / 0 (risk_band low) | 해당 없음 |
| 비용 | 사전 스크립트 1회 + Opus 1콜 + 게이트 스크립트 1회 | 1콜 |

- 둘은 **다른 일**을 한다. voice-polish 는 유씨의 글을 영어로 다듬고 AI 티는 표시만 한다. humanize-korean 은 AI 가 쓴 한국어를 한국어로 고친다.
- humanize-korean 의 의미 보존 장치(내용 앵커, 결정적 게이트 `verify_gates.py`)는 실제로 작동했다. 과하게 고치지 않았다.

## 다시 볼 조건
- 긴 한국어 AI 초안을 정기적으로 만들기 시작할 때. 예: 81편 `summary_ko` 채우기, 네이버 배포 원고.
- 그때는 통째로 설치하지 않는다. `skills/humanize-korean/` + 런타임 스크립트 5개 + 에이전트 3종만 들인다. `_workspace/` 는 scratchpad 로 돌리고, `.gitignore` 를 확인한다.
- **유씨 본인의 글에는 쓰지 않는다**(voice-polish 원칙: 비원어민 글의 AI 탐지는 자주 틀린다).

재료(시험 입력·결과·스캔 보고서)는 세션 scratchpad 에만 있다. repo 에는 넣지 않았다.
