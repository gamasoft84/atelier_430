-- Texto derivado de tags (TEXT[]) para búsqueda ilike en PostgREST.
-- array_to_string() no es IMMUTABLE → la expresión generada debe usar solo casts/coalesce inmutables.

ALTER TABLE public.artworks DROP COLUMN IF EXISTS tags_search;

ALTER TABLE public.artworks
ADD COLUMN tags_search text
GENERATED ALWAYS AS (coalesce(tags::text, '')) STORED;

COMMENT ON COLUMN public.artworks.tags_search IS
  'Derivado de tags (solo lectura). Formato {tag1,tag2}; para ILIKE; no actualizar a mano.';
