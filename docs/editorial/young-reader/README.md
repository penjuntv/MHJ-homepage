# 아이들의 이달의 책 — 현이 (Level 1) · 민이 (Level 2)

아이들이 한 달에 책 한 권을 읽고, 한국어와 영어로 **각각** 매거진 칼럼을 쓰는 워크플로우.

| | 현이 · Level 1 (Hyun, Y5) | 민이 · Level 2 (Min) |
|---|---|---|
| 3일째 | 생각 한 줄 · 근거 1 · "하지만" | 주장+이유 · **근거 2** · **반론에 답하기** ("~다"체) |
| 4일째 | 나와 연결 · 질문 · 그림 | 왜 지금 중요한가 · 결론+질문 · **책 밖 자료 1개로 확인** |
| 기자 책상 | 한 문장 고치기 · 한 200~500자 / EN 60~150 | 두 문장 고치기 · 한 400~800자 / EN 120~250 |

아이 설정은 `worksheet.html`·`writer.html`·`guides/kid-guide.html`의 `KIDS`(같은 키)와 `render.mjs`의 `KIDS`에 있다. 새 아이를 추가하려면 네 곳에 한 줄씩 넣는다. 직접 열 때는 `?kid=min`.
핵심은 **"칸 하나 = 기사 문장 하나"**. 칸을 순서대로 채우고 옮겨 치면 글이 되고, 쪽마다 매거진 재료(표지 사진·인포그래픽·그림)가 나온다.

## 한눈에

```
현이 (하루 20분)                                  부모 · Claude
─────────────────────────────                    ─────────────────────────────
1일 📖 책 만나기 ── 표지 사진 📷 ────────────────→ 사진 칸 ①
2일 🔍 책 속으로 (종류별 쪽) ── 쪽 사진 📷 ──────→ Claude → 인포그래픽 PNG (본문 삽입)
3일 💭 내 생각 ①~④  ┐
4일 🎨 나와 연결 ⑤⑥ + 그림 📷 + 제목 ──────────→ 사진 칸 ②
5일 ⌨️ writer.html 에 옮겨 치기 → [복사해서 보내기] → 카톡 → Claude → mhj-desk 기사 초안
                                                  → 현이 최종 확인 → 발행
```

## 파일

| 파일 | 누가 | 용도 |
|---|---|---|
| `print/<hyun|min>/worksheet-<종류>.pdf` | 아이 | **책 한 권 = PDF 한 개** 인쇄 (5쪽: 표지 · 1일 · 2일 종류별 · 3일 · 4일). 종류: `history` 역사 · `story` 이야기·고사성어 · `geography` 지리 · `culture` 문화 · `society` 사회 · `any` 어떤 책이든 |
| `writer.html` | 현이 | **기자 책상**. 브라우저로 열어 종이 칸을 옮겨 치면 오른쪽에 매거진 지면이 실시간으로 만들어짐. 자동 저장, 빈 칸 안내, 체크리스트를 마쳐야 보내기 버튼이 열림 |
| `parent-guide.md` | PeNnY · Yussi | 한 장. 15분 수다 질문과 하지 말 것 |
| `magazine-conversion.md` | PeNnY + Claude | 원고 → 인포그래픽 → mhj-desk 기사. 복붙용 Claude 프롬프트 포함 |
| `infographic.html` + `infographics/` | Claude | 인포그래픽 틀 6종. `infographics/examples/` 에 종류별 예시 JSON (PNG는 레포 규칙상 `*.png` 무시 → 아래 명령으로 생성) |
| `worksheet.html` · `render.mjs` | 관리 | 원본과 생성 스크립트 |

## 메일로 보내기 📧

`share/` 폴더에 받는 사람별로 정리되어 있다. **zip 하나씩 첨부하면 끝.**

| 첨부 | 안에 든 것 |
|---|---|
| `share/현이에게.zip` · `share/민이에게.zip` | 1_먼저-읽어요.pdf (한 장, 아이별) · 2_인쇄할-워크시트/ (책 종류별 6개) · 3_기자책상.html (아이 이름이 박혀 있음) |
| `share/유씨에게.zip` | 1_유씨-가이드.pdf (세 장: 아이와 함께 / 사진·기자 책상 / 매거진에 올리기) · 2_현이-워크시트/ · 2_민이-워크시트/ · 3_현이-기자책상.html · 3_민이-기자책상.html · 4_인포그래픽-예시/ |

`print/`·`share/`는 생성물이라 git에 올리지 않는다(`.gitignore`). 처음 받았거나 원본을 고친 뒤에는 아래 명령으로 만든다.

## 다시 만들기 (repo 루트에서)

```bash
node docs/editorial/young-reader/render.mjs infographic docs/editorial/young-reader/infographics/examples && node docs/editorial/young-reader/render.mjs worksheets && node docs/editorial/young-reader/render.mjs share
```

```bash
node docs/editorial/young-reader/render.mjs infographic docs/editorial/young-reader/infographics/examples
```

월별 실제 원고는 `infographics/<YYYY-MM>/` 에 JSON 을 두고 같은 명령으로 PNG 를 만든다.

실명 규칙: 이 폴더, 원고, 이미지 파일명, 매거진 어디에도 아이 실명 금지. **현이 / Hyun**만.
