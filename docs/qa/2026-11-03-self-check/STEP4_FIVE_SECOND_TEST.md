# STEP 4 — 사람 5초 테스트 페이지 (2026-11-03)

> 지시서 §2 STEP 4. 이 세션은 페이지를 만들고 링크를 보고한다. 테스트 진행(사람 3명 이상)은 PeNnY 몫이다.

## 링크

- **https://claude.ai/artifact/9VzcuqfMSaiJNpSF4JXZJB** (Artifact 이름 "MHJ 홈 5초 테스트", 버전 1)
- 지금은 **비공개(소유자만 열림)** 다. 응답자 기기에서 열려면 PeNnY 가 페이지의 Share 메뉴로 공유해야 한다. 진행자가 자기 기기로 보여 주는 방식이면 공유하지 않아도 된다.
- 원본: [`five-second-test/index.html`](five-second-test/index.html). StoryPress판 틀(`attachments/five-second-test/index.html`)에서 이름·질문·자동 집계 낱말만 바꿨다.

## 무엇을 보여 주나

| 시안 | 넓은 화면(폭 700px 이상) | 폰 |
|---|---|---|
| A 현행 | `img/a-wide.png` = before `home-1280-light.png` | `img/a-phone.png` = before `home-390-light.png` |
| B 시안 | `img/b-wide.png` = after-B `home-1280-light.png` | `img/b-phone.png` = after-B `home-390-light.png` |

- 순서는 응답자마다 무작위(A→B 또는 B→A)이고, 기록에 `order` 로 남는다.
- 화면은 5초 뒤 사라지고 다시 보여 주지 않는다. 마지막 질문에서만 두 장을 작게 나란히 보여 준다.
- 실명 점검: 네 장 모두 STEP 0·3 캡처 때 본문·alt·meta 실명 검사 0. 화면 속 이름은 사이트 표기 "Jin"·"Yussi" 뿐이다.

## 질문 (지시서 ①~④)

1. 이 사이트는 무엇을 하는 곳 같나요? (화면마다)
2. 누가 쓰는 곳 같나요? (화면마다)
3. 가장 먼저 눈에 들어온 것은 무엇이었나요? (화면마다)
4. 두 화면 중 어느 쪽이 더 믿음이 가나요? + 이유 (+ 선택: 다음에 누르고 싶은 곳)

- 응답자 유형은 "처음 보는 분 / 지인 / 가족" 셋, 기기는 "폰 / 태블릿 / 컴퓨터" 셋이다.
- **이름·연락처를 묻는 칸은 없다.** 화면에 "적지 마세요" 안내가 있다.
- 한국어·영어 전환을 지원한다.
- 결과 보기(편집 권한자 전용)는 자동 집계를 보여 준다. Q1 에 "가족·기록" 낱말과 "뉴질랜드·오클랜드" 낱말이 둘 다 있는가, Q2 에 "한국인 가족" 낱말이 있는가, 어느 쪽이 더 믿음이 갔는가. 원문도 함께 보여 준다.

## 저장 (db)

- 선언: `capabilities: { db: { rules: [{ path: "responses", read: "interact", write: "interact" }] }, user: {} }`. 지시서대로 읽기·쓰기 모두 `interact` 이고, StoryPress판과 같다.
- 저장할 수 없는 기기(로그아웃 등)에서는 결과 글을 복사해 보내도록 안내한다(틀의 동작 그대로).

### 저장 시험 기록 (2026-11-03)

| 순서 | 동작 | 권한 | 결과 |
|---|---|---|---|
| 1 | `set` `responses/probe-2026-11-03`(시험 행) | interact | 성공, version 1 |
| 2 | `list` `responses` | view | 0건 — `view` 는 읽기 규칙(`interact`)에 막힘. 의도대로 |
| 3 | `list` `responses` | interact | 1건(시험 행) 보임 |
| 4 | `delete` `responses/probe-2026-11-03`(if_version 1) | interact | 성공 |
| 5 | `list` `responses` | 소유자 | 0건 (첫 시도는 네트워크 오류, 재시도에서 0건) |

## 응답 수

**0건 — 사람 검증 대기.** 진행은 PeNnY 몫이다. 결과가 모이면 기획안(`UPGRADE_PLAN.md`)의 시안 결정에 응답 수를 그대로 적는다.
