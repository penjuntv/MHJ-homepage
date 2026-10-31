-- 2026-10-31 라이브 적용 (Supabase migration: subscribers_unsubscribe_token)
-- 옛 구독취소는 이메일 주소만으로 해지됐다(남이 대신 해지 가능) → 구독자별 비밀 토큰으로 바꾼다.
-- 기존 행도 ADD COLUMN 시 default 로 각자 다른 uuid 가 채워진다.
-- 노출: subscribers 는 RLS on, 정책은 authenticated + mhj_is_admin() 하나뿐 → anon 은 행 0개.
alter table public.subscribers
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();
create unique index if not exists subscribers_unsubscribe_token_key on public.subscribers (unsubscribe_token);
comment on column public.subscribers.unsubscribe_token is '메일 구독취소 링크·List-Unsubscribe 원클릭용 비밀 토큰. 공개 노출 금지(RLS: 관리자만).';
