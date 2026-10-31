-- 2026-11-01 라이브 적용
-- blogs#109 slug 끝 마침표 제거(공유 링크 404) + 형식 제약. 옛 주소는 next.config.mjs 308.
update public.blogs set slug='honestly-i-got-lost' where id=109 and slug='honestly-i-got-lost.';
alter table public.blogs
  add constraint blogs_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
