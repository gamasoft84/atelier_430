-- Physical units per artwork row (religiosa: same image, multiple copies in stock).
ALTER TABLE artworks
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 1
    CHECK (stock_quantity >= 0);

COMMENT ON COLUMN artworks.stock_quantity IS
  'Unidades en inventario para esta referencia. Religiosa puede ser >1; otras categorías deben ser 1.';

UPDATE artworks SET stock_quantity = 1 WHERE stock_quantity IS NULL;
