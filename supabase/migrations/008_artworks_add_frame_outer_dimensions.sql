-- =============================================
-- ATELIER 430 — Añade dimensiones externas (con marco)
-- Ejecutar en: Supabase > SQL Editor
-- =============================================
--
-- `width_cm` y `height_cm` siguen siendo las medidas de la obra (lienzo / pintura).
-- Estas nuevas columnas guardan el tamaño total que ocupa la pieza en la pared
-- cuando incluye marco. Solo se llenan si `has_frame = true`.

ALTER TABLE artworks
  ADD COLUMN IF NOT EXISTS frame_outer_width_cm  INTEGER,
  ADD COLUMN IF NOT EXISTS frame_outer_height_cm INTEGER;

COMMENT ON COLUMN artworks.frame_outer_width_cm  IS 'Ancho total de la obra incluyendo el marco (cm). NULL si no aplica.';
COMMENT ON COLUMN artworks.frame_outer_height_cm IS 'Alto total de la obra incluyendo el marco (cm). NULL si no aplica.';
