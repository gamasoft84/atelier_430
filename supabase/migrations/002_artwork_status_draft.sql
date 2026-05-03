-- Estado borrador para importación masiva (no aparece en catálogo público)
ALTER TABLE artworks DROP CONSTRAINT IF EXISTS artworks_status_check;

ALTER TABLE artworks ADD CONSTRAINT artworks_status_check
  CHECK (status IN ('available', 'reserved', 'sold', 'hidden', 'draft'));
