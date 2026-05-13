-- Texto plano de tags para búsqueda ilike en PostgREST (admin / listados).
-- Se mantiene en sync con la columna tags (TEXT[]).

ALTER TABLE public.artworks
ADD COLUMN IF NOT EXISTS tags_search text
GENERATED ALWAYS AS (COALESCE(array_to_string(tags, ' '), '')) STORED;

COMMENT ON COLUMN public.artworks.tags_search IS
  'Derivado de tags (solo lectura). Para filtros tipo ILIKE; no actualizar a mano.';
