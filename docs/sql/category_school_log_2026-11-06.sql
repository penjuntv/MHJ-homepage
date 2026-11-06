-- 카테고리 이름 변경: Whānau → School Log (2026-11-06, PeNnY 지시 "즉각 수정해서 라이브 반영")
-- 대상: blogs.category = 'Whānau' 5편(모두 published).
-- 순서(화면이 깨지는 틈을 줄이려고 나눠서 실행):
--   ① 제약에 'School Log' 추가(옛 값도 허용)  → 코드 PR 머지 직전
--   ② 글 5편 값 변경                            → 코드 PR 머지 직후(새 빌드가 새 값으로 그려지게)
--   ③ 제약에서 'Whānau' 제거                    → 운영 배포 READY 확인 뒤

-- ① 전환용 제약
ALTER TABLE public.blogs DROP CONSTRAINT blogs_category_check;
ALTER TABLE public.blogs ADD CONSTRAINT blogs_category_check CHECK (category = ANY (ARRAY[
  'Little 15 Mins', 'Home Learning', 'Whānau', 'School Log', 'Settlement', 'Life in Aotearoa', 'Travelers', 'Local Guide'
]::text[]));

-- ② 값 변경
UPDATE public.blogs SET category = 'School Log' WHERE category = 'Whānau';

-- ③ 최종 제약
ALTER TABLE public.blogs DROP CONSTRAINT blogs_category_check;
ALTER TABLE public.blogs ADD CONSTRAINT blogs_category_check CHECK (category = ANY (ARRAY[
  'Little 15 Mins', 'Home Learning', 'School Log', 'Settlement', 'Life in Aotearoa', 'Travelers', 'Local Guide'
]::text[]));

-- 되돌리기: 위 ①을 다시 실행 → UPDATE ... SET category = 'Whānau' WHERE category = 'School Log'
--          → ③의 배열에서 'School Log' 대신 'Whānau' 로 제약 재생성. 코드는 이 PR 을 revert.
