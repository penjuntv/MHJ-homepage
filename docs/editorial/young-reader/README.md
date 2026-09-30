# 아이들의 이달의 책 — v1.0

지니(L0, Year 1) · 현이(L1, Year 5) · 민이(L2, Year 7)가 한 달에 책 한 권을 읽고 MHJ 매거진에 한국어·영어 글을 싣는 워크플로우. **운영 방법은 전부 `guides/manual.html`(= 배포본의 `1_운영매뉴얼.pdf`)에 있다.** 이 README 는 관리용.

## 배포 원칙

가족에게는 **점검을 끝낸 버전 꾸러미 하나만** 보낸다. 고칠 것은 모아서 다음 버전(v1.1…)에 한 번에 반영한다. 작은 수정마다 재전송하지 않는다.

```bash
node docs/editorial/young-reader/render.mjs release
```

→ `release/MHJ-이달의책-v1.0/` + `.zip` (약 17MB, Gmail 25MB 한도 안). 이 명령이 예시 인포그래픽 → 워크시트 PDF → 매뉴얼용 기자 책상 화면 사진(예시 데이터) → 매뉴얼·안내서 PDF → 꾸러미 폴더 → zip(한글 파일명 NFC + UTF-8 플래그)까지 한 번에 만든다.

```
MHJ-이달의책-v1.0/
├ 1_운영매뉴얼.pdf
├ 2_현이/  현이-안내.pdf · 워크시트/ (책 종류별 6) · 현이-기자책상.html
├ 3_민이/  민이-안내.pdf · 워크시트/ (책 종류별 6) · 민이-기자책상.html
├ 4_지니/  지니-워크시트.pdf · 지니-기자책상(엄마아빠용).html
├ 5_가족북클럽/  가족토론-기록지.pdf
└ 6_참고-인포그래픽-예시/
```

**버전 올릴 때**: `render.mjs` 의 `VERSION`, 그리고 꼬리말의 `v1.0` (`grep -rn "v1.0" docs/editorial/young-reader --include=*.html`).

## 파일

| 파일 | 역할 |
|---|---|
| `worksheet.html` | 인쇄 워크시트. `?kid=hyun\|min\|jin&genre=…`. L0 은 전용 5쪽, L1/L2 는 공통 4쪽 + 책 종류별 2일째 쪽 |
| `writer.html` | 기자 책상 (단독 HTML). 아이별 localStorage 키(글 / `-photos`), 2일째 쪽 → 인포그래픽(html2canvas), 코치 힌트, 📦 한 파일 저장, 가족 북클럽 표시. 배포본에는 `window.KID` 와 `infographic-core.js` 가 안에 심긴다 |
| `infographic-core.js` | 인포그래픽 렌더러 (CSS 는 `.ig` 안). `writer.html` 과 `infographic.html` 공용 |
| `infographic.html` · `infographics/examples/*.json` | render.mjs 로 PNG 만들기 (1600×1200). JSON `"kid"` 로 이름 표기 |
| `guides/manual.html` | 운영 매뉴얼 10쪽 (`guides/shots/` 화면 사진은 release 가 만든다) |
| `guides/kid-guide.html` | 아이 안내 1쪽 (`?kid=`) |
| `guides/book-club.html` | 가족 토론 기록지 1쪽 |
| `magazine-conversion.md` | 받은 원고 → mhj-desk 변환 규칙 · Claude 프롬프트 |
| `render.mjs` | `release` · `worksheets` · `infographic <json\|dir>` · `preview <dir> [kid]` |

## 알아둘 제약

- 아이 설정(KIDS)은 `worksheet.html` · `writer.html` · `guides/kid-guide.html` · `render.mjs` 네 곳에 같은 키로 있다.
- 크롬은 `file://` HTML 들이 localStorage 한 곳(약 5MB)을 같이 쓴다 → 세 아이 사진이 한 공간. 사진은 긴 변 1200px JPEG q0.72, "새 책 시작하기"가 글·사진을 모두 지운다. 꽉 차면 알림.
- 기자 책상은 **크롬 권장** (Safari `file://` 저장·다운로드는 검증 안 됨). 글꼴·html2canvas 때문에 인터넷 필요.
- 매거진 사진 칸은 `object-fit: cover` 로 잘린다 → 인포그래픽은 본문 이미지로.
- `print/` `release/` `guides/shots/` 는 생성물(`.gitignore`), 레포는 `*.png` 무시.
- 실명 금지: 지니/Jin · 현이/Hyun · 민이/Min 만.
