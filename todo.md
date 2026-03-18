# MHJ HOMEPAGE — TODO

## 🔴 현재 진행 중
(없음)

## ⚠️ DB 마이그레이션 필요 (Supabase SQL Editor)
```sql
-- gallery.photographer 구 이름 → 신 이름
UPDATE gallery SET photographer = 'Min'  WHERE photographer = 'Yumin';
UPDATE gallery SET photographer = 'Hyun' WHERE photographer = 'Yuhyeon';
UPDATE gallery SET photographer = 'Jin'  WHERE photographer = 'Yujin';

-- articles.author 구 이름 → 신 이름 (있을 경우)
UPDATE articles SET author = 'Min'  WHERE author = 'Yumin';
UPDATE articles SET author = 'Hyun' WHERE author IN ('Yuhyeon', 'Yuhyun');
UPDATE articles SET author = 'Jin'  WHERE author = 'Yujin';

-- blogs.author 기본값 변경
ALTER TABLE blogs ALTER COLUMN author SET DEFAULT 'Yussi';
```

## 🟢 완료 (최근)
- [x] 블로그 상세 제목 72px 상한 적용, word-break: keep-all
- [x] DetailModal 제목 word-break break-all → keep-all (단어 중간 줄바꿈 방지)
- [x] 드롭캡 색상: #F1F5F9→#CBD5E1(라이트), 다크모드도 #475569으로 수정, CSS var 통일
- [x] 갤러리 필터: Min/Hyun/Jin/PeNnY/Yussi (5명+All), 색상 매핑 추가
- [x] 매거진 이름 통일: Min/Hyun/Jin/PeNnY/Yussi (유민/유현/유진 제거)
- [x] 매거진 ID 중복 방지: submit 시 자동 -02/-03 suffix
- [x] 전체 콘텐츠 크기 축소: --fs-display→56px, --fs-h1→48px, 히어로→90px, 갤러리→80px
- [x] 갤러리 그리드 반응형: CSS columns 2/3/4열 (mobile/tablet/desktop), max-width 1400px
- [x] Reader Favorites: 넷플릭스 캐러셀 (5개, 가로스크롤, 좌우화살표, 순위배지)
- [x] admin↔public 동기화 전수 감사: 갤러리 촬영자·매거진 에디터/저자·블로그 카테고리 순서 통일
- [x] 블로그 본문 이미지 이전 완료 (20개 글, 77개 이미지 → Supabase Storage, blockquote→figure 교체)

## 🟡 다음 대기
- [ ] Newsletter 라이브 발송 테스트
- [ ] 더미 매거진 3개 정리
- [ ] article_reactions 프론트엔드 구현
- [ ] StoryPress 페이지 디자인

## 🟢 완료
- [x] 다크 모드 감사 (20파일)
- [x] Framer 레거시 이전
- [x] Admin 사이드바 4그룹 구조
- [x] 매거진 에디터 전체
- [x] SEO 16파일 정리
- [x] DESIGN_RULES.md 작성
- [x] Gallery 구현 (마소니 레이아웃, 라이트박스)
- [x] Phase 3 구현 (댓글, 태그, 예약발행, 뉴스레터)
- [x] Claude Code 최적화 완료 (docs/ 폴더, 슬림 CLAUDE.md, DB_SCHEMA.md, AGENTS.md, WORKFLOW.md, todo.md)

## 📋 백로그
- OG 이미지 자동 생성
- 도메인 구매 (mhj.nz)
- NZ School Guide 시리즈
- Upper Harbour 보조금 신청
- 서가 책등 텍스처 (grain/noise 오버레이)
- 서가 이슈별 고유 spine_color
