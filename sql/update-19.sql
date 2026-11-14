-- ============================================================
-- Mr Sadu POS - UPDATE 19  (safe to run more than once)
--   Social Media links for bills: Facebook, Instagram, TikTok
--   (the Google review link keeps using the existing review_link column)
-- Supabase > SQL Editor > New query > paste all > Run
-- ============================================================
alter table public.settings add column if not exists social_facebook  text not null default '';
alter table public.settings add column if not exists social_instagram text not null default 'https://www.instagram.com/mr.batzy?utm_source=qr';
alter table public.settings add column if not exists social_tiktok    text not null default '';
