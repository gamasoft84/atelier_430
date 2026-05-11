-- Marca una imagen como "premium" (render/foto styled, listo para vender).
-- Es ortogonal a is_primary: una imagen puede ser ambas, ninguna o sólo una.
-- El form admin asegura que sólo haya una imagen premium por obra a la vez.
--
-- Uso:
--   - PDF de ficha (B2B): SIEMPRE prefiere premium si existe → fallback a primary.
--   - Generador de posts en redes: SIEMPRE prefiere premium → fallback a primary.
--   - Catálogo público y detalle de obra: depende del setting global
--     `prefer_premium_in_catalog` (ver migración 010).
--   - Vistas admin (tabla, dashboard, drafts, AR): SIEMPRE primary (foto técnica).

ALTER TABLE artwork_images
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN artwork_images.is_premium IS
  'Imagen marcada como "premium para vender" (render o foto styled). Sólo una por obra; el form lo asegura. Usada en PDF, redes y opcionalmente en catálogo según site_settings.prefer_premium_in_catalog.';

-- Index parcial para acelerar las queries que buscan la imagen premium de una obra.
CREATE INDEX IF NOT EXISTS artwork_images_premium_idx
  ON artwork_images(artwork_id) WHERE is_premium = true;
