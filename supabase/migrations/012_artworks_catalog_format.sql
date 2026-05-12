-- Formato de presentación en catálogo (grid público). No se deriva de width_cm/height_cm.
ALTER TABLE artworks
ADD COLUMN catalog_format text NOT NULL DEFAULT 'horizontal'
  CONSTRAINT artworks_catalog_format_check
  CHECK (catalog_format IN ('horizontal', 'vertical'));

COMMENT ON COLUMN artworks.catalog_format IS
  'Cómo se muestra la obra en tarjetas del catálogo y filtros: horizontal (tile ancho) o vertical (tile alto). Editable en admin; no refleja medidas del lienzo.';
