-- Atomic increment functions for artwork tracking counters.
-- Ejecutar en Supabase SQL Editor antes de usar los contadores.

create or replace function increment_artwork_views(p_id uuid)
returns void
language sql
security definer
as $$
  update artworks set views_count = views_count + 1 where id = p_id;
$$;

create or replace function increment_artwork_whatsapp_clicks(p_id uuid)
returns void
language sql
security definer
as $$
  update artworks set whatsapp_clicks = whatsapp_clicks + 1 where id = p_id;
$$;
