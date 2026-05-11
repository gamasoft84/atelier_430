-- Setting global: cuando una obra tiene una imagen `is_premium`, ¿el catálogo
-- público (listing + detalle) debe preferirla sobre `is_primary`?
--
--   true  → catálogo muestra premium si existe (fallback a primary).
--   false → catálogo siempre muestra primary, aunque haya premium.
--
-- El PDF y el generador de posts en redes IGNORAN este setting: siempre
-- prefieren premium si existe (son contextos de venta directa).

INSERT INTO site_settings (key, value)
VALUES ('prefer_premium_in_catalog', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
