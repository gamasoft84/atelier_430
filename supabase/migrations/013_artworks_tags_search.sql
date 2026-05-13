-- Texto plano de tags para búsqueda ilike en PostgREST (admin).
-- Las columnas GENERATED exigen expresiones IMMUTABLE; casts y array_to_string
-- no califican → columna normal + trigger BEFORE INSERT/UPDATE.

DROP TRIGGER IF EXISTS artworks_tags_search_trg ON public.artworks;
DROP FUNCTION IF EXISTS public.artworks_sync_tags_search();

ALTER TABLE public.artworks DROP COLUMN IF EXISTS tags_search;

ALTER TABLE public.artworks
ADD COLUMN tags_search text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.artworks.tags_search IS
  'Derivado de tags (sincronizado por trigger). Para ILIKE; no editar a mano.';

CREATE OR REPLACE FUNCTION public.artworks_sync_tags_search()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.tags_search := coalesce(array_to_string(NEW.tags, ' '), '');
  RETURN NEW;
END;
$$;

CREATE TRIGGER artworks_tags_search_trg
BEFORE INSERT OR UPDATE OF tags ON public.artworks
FOR EACH ROW
EXECUTE FUNCTION public.artworks_sync_tags_search();

UPDATE public.artworks
SET tags_search = coalesce(array_to_string(tags, ' '), '');
