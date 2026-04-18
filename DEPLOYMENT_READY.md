# 매거진 v2 · 2D — 배포 체크리스트 (Yussi 공유용)

**배포 완료일**: 2026-04-18
**라이브**: https://www.mhj.nz/magazine

---

## 확인 순서

### 1. 공개 서가 / 이슈 상세 / 뷰어 (회원 가입 없이)

| 경로 | 확인 |
|------|------|
| https://www.mhj.nz/magazine | 책장 + 책등 UI. 책에 마우스 올리면 앞으로 튀어나오며 표지 노출 |
| https://www.mhj.nz/magazine/2026-02 | 큰 표지 + "INSIDE THIS ISSUE" 그리드. Cover / Contents / 각 기사 썸네일이 **실제로** 어떻게 보이는지 확인 |
| https://www.mhj.nz/magazine/2026-03 | "Next Steps" 5개 기사 |
| 썸네일 클릭 | 뷰어로 이동 + 해당 페이지 바로 열림 |
| 모바일 브라우저 | 책등 UI 대신 2열 카드 그리드로 자동 전환 |
| 다크모드 토글 | 책장이 월넛 톤으로 바뀜 |

### 2. Admin 편집 (로그인 후: /mhj-desk)

**기사 편집 (`/mhj-desk/magazines/{id}` 탭 2)**

각 템플릿 선택 시 해당 입력 섹션이 **자동으로** 나타남:

- **Title Card / Photo Hero** → "타이틀 · 소제목" 섹션
  - Kicker (카테고리 라벨)
  - Subtitle (소제목)
- **Sidebar** → "사이드바 콘텐츠" 섹션
  - Sidebar Title
  - Sidebar Body (HTML 가능)
- **Directory** → "목차 항목" 섹션
  - 항목별: 번호 / 페이지 / 제목 / 설명
  - ↑↓ 순서 변경, + 추가, × 삭제
- **Pull Quote** → "인용구" 섹션
  - Quote Text
  - Attribution

**표지 설정 (`/mhj-desk/magazines/{id}` 탭 1)**

- 악센트 컬러
  - 8색 프리셋
  - 시즌 4색 (Sage / Ocean / Sienna / Slate)
  - 커스텀 색 피커
- 저장 시 해당 이슈의 **모든 기사** kicker 색, pull-quote 장식선, divider 색 즉시 반영

### 3. 수동 스모크 (한 번씩 해보기)

- [ ] 새 기사 `title-card` 선택 → kicker "Opener", subtitle 한 줄 입력 → 저장 → 이슈 상세의 해당 썸네일에 반영
- [ ] `directory` 선택 → 항목 3개 추가 (번호/제목/페이지) → 저장 → 뷰어에서 목차 페이지 확인
- [ ] `pull-quote` 선택 → quote_text 입력 → 저장 → 뷰어 인용구 페이지에 accent 색 따옴표 장식
- [ ] `sidebar` 선택 → sidebar_title "Notes", body `<ul><li>첫번째</li></ul>` → 저장 → 뷰어 사이드 박스 렌더
- [ ] accent_color를 Sienna (가을)로 변경 → 저장 → 라이브 뷰어에서 kicker 색 오렌지톤으로 변경 확인

---

## 이번 변경으로 해결된 것

1. ✅ **진짜 책장 서가** 부활 (spine → cover 호버 확장)
2. ✅ **이슈 상세** 썸네일이 **실제 페이지 렌더링**으로 표시 (이전의 "01/02/03" 가짜 숫자 사라짐)
3. ✅ Admin 미리보기 / 라이브 뷰어 / 이슈 상세 썸네일 — **3곳 완전 일치**
4. ✅ 템플릿 도식 42:55 세로 판형 비율
5. ✅ 신규 템플릿 4종 + PhotoHero에 **전용 입력 필드** 추가 (본문 파싱 편법 제거)
6. ✅ 이슈별 악센트 색이 라이브에 정확히 반영

## 혹시 발견하면 알려주세요

- 썸네일 컨텐츠가 잘려 보이거나 공간이 비어 보이는 경우 (PageThumbnail scale 추가 조정 필요)
- 책등 호버 애니메이션이 어색한 속도/방향인 경우
- 템플릿 도식 내부 와이어프레임이 실제 레이아웃과 안 맞는 경우
- accent_color가 특정 템플릿에서 반영되지 않는 경우
