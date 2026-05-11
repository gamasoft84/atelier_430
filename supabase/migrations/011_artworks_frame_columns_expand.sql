-- Amplía los campos descriptivos del marco para permitir descripciones más
-- ricas como "polirresina dorada con relieves", "madera de pino natural",
-- "dorado envejecido con pátina antigua", etc. El límite anterior de 50
-- caracteres resultaba corto para describir marcos clásicos europeos.

ALTER TABLE artworks
  ALTER COLUMN frame_material TYPE VARCHAR(100),
  ALTER COLUMN frame_color    TYPE VARCHAR(100);
