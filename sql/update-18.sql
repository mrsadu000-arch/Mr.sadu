-- ============================================================
-- Mr Sadu POS - UPDATE 18  (safe to run more than once)
--   * Item photos: items.image_url + public photo bucket "items"
--   * Customer QR menu also gets the photos
--   * Shop name / tagline changed from the old name to Mr Sadu (only if they still have the old values)
-- Supabase > SQL Editor > New query > paste all > Run
-- ============================================================
alter table public.items add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('items', 'items', true)
on conflict (id) do nothing;

drop policy if exists "items staff upload" on storage.objects;
create policy "items staff upload" on storage.objects for insert to authenticated with check (bucket_id = 'items');
drop policy if exists "items staff read" on storage.objects;
create policy "items staff read" on storage.objects for select to authenticated using (bucket_id = 'items');
drop policy if exists "items staff update" on storage.objects;
create policy "items staff update" on storage.objects for update to authenticated using (bucket_id = 'items');
drop policy if exists "items staff delete" on storage.objects;
create policy "items staff delete" on storage.objects for delete to authenticated using (bucket_id = 'items');

-- customer QR page: same menu as before + image_url
create or replace function public.qr_menu() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'open',  coalesce((select qr_open from settings where id = 1), true),
    'shop',  (select jsonb_build_object('name', shop_name, 'tagline', tagline, 'phone', phone) from settings where id = 1),
    'categories', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name) order by sort, name) from categories), '[]'::jsonb),
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'category_id', category_id, 'name', name, 'price', price,
                'allow_addons', allow_addons, 'track_stock', track_stock, 'stock', greatest(stock, 0), 'image_url', image_url) order by name) from items where active), '[]'::jsonb),
    'addons', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'price', price) order by name) from addons where active), '[]'::jsonb)
  )
$$;
grant execute on function public.qr_menu() to anon, authenticated;

-- rename the shop (only when the old Maru Bun values are still there; your own edits are never overwritten)
update public.settings set shop_name = 'Mr Sadu' where id = 1 and shop_name in ('මරු Bun', 'Maru Bun');
update public.settings set tagline = 'Juice Bar & Burger Shop' where id = 1 and tagline = 'The Taste of Something Special.';
update public.settings set address = '' where id = 1 and address = 'PVHX+2RG New Bridge Bus Stop, Panadura, Moratuwa';
