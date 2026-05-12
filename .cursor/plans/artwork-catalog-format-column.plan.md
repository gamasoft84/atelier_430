# Plan: columna de formato catálogo (horizontal / vertical)

## Decisión de producto (iteración)

- **Nueva columna en PostgreSQL**, no derivada de `width_cm` / `height_cm` (las medidas no reflejan bien el formato real).
- **Default en BD: `horizontal`**; Rick corrige manualmente a `vertical` donde aplique (admin).
- **Uso principal:** coherencia visual en tarjetas + **filtro en catálogo público** (y mismo criterio donde ya se listan obras con `ArtworkCard`).

## Esquema sugerido

- Nombre columna (propuesta): `catalog_format` (o `presentation_format`).
- Tipo: `text` con `CHECK (catalog_format IN ('horizontal', 'vertical'))` **o** tipo enum Postgres.
- `NOT NULL DEFAULT 'horizontal'`.
- Comentario en columna aclarando que describe **cómo se muestra en grid catálogo**, no la medida del lienzo.

Tras migración, filas existentes quedan `horizontal` por default; no hay backfill automático a vertical.

## Archivos y superficies de impacto

### Base de datos y tipos

- Nueva migración en [`supabase/migrations/`](supabase/migrations/) (siguiente número disponible).
- Actualizar tipos generados / manuales en [`types/database.ts`](types/database.ts) (tabla `artworks` Insert/Update/Row).

### Select unificado de obra pública

- [`lib/supabase/queries/artwork-row.ts`](lib/supabase/queries/artwork-row.ts): añadir columna a `ARTWORK_SELECT` para que fluya a todas las queries que lo reutilizan.

### Tipos de dominio y formularios

- [`types/artwork.ts`](types/artwork.ts): `Artwork`, `ArtworkPublic`, `ArtworkFormData` + tipo union `CatalogFormat = 'horizontal' | 'vertical'`.
- [`types/api.ts`](types/api.ts) si hay payloads que incluyan subset de obra.

### Catálogo público y URL

- [`types/catalog.ts`](types/catalog.ts): `CatalogParams` + `parseCatalogParams` + `hasActiveFilters` — parámetro URL (ej. `formato=horizontal,vertical` o un solo valor); validar contra valores permitidos.
- [`lib/supabase/queries/catalog.ts`](lib/supabase/queries/catalog.ts): filtrar en capa JS (como `tamanos`) **después** de `normalizeArtworkRow`, comparando `catalog_format` con selección; si array vacío, sin filtro.
- [`components/public/catalog/FilterSidebar.tsx`](components/public/catalog/FilterSidebar.tsx): sección de checkboxes (Horizontal / Vertical), mismo patrón que categoría/tamaño.
- [`components/public/catalog/CatalogClient.tsx`](components/public/catalog/CatalogClient.tsx): pasar nuevo estado desde `params` al sidebar y asegurar que `clearHref` / transiciones reseteen `page`.

### Tarjetas y grids (reemplazar heurística por imagen)

- [`components/public/ArtworkCard.tsx`](components/public/ArtworkCard.tsx): hoy `isHorizontal` sale de **píxeles de la imagen** showcase; cambiar a **`artwork.catalog_format === 'vertical'`** → contenedor `aspect-[3/4]` + `object-cover`; horizontal → `aspect-[4/3]` + `object-contain` (misma lógica visual actual, fuente de verdad distinta).
- Consumidores de `ArtworkCard` (heredan el cambio vía props `artwork`):
  - [`components/public/catalog/CatalogClient.tsx`](components/public/catalog/CatalogClient.tsx)
  - [`components/public/FeaturedGrid.tsx`](components/public/FeaturedGrid.tsx)
  - [`components/public/RelatedArtworks.tsx`](components/public/RelatedArtworks.tsx)
  - [`components/public/favoritos/FavoritosPageClient.tsx`](components/public/favoritos/FavoritosPageClient.tsx)

### Detalle de obra (opcional pero recomendado)

- [`app/(public)/catalogo/[code]/page.tsx`](app/(public)/catalogo/[code]/page.tsx): chip o línea en bloque técnico (“Formato: vertical / horizontal”) para coherencia con el catálogo; no sustituye medidas en cm.

### Galería en detalle

- [`components/public/ArtworkGallery.tsx`](components/public/ArtworkGallery.tsx): hoy el thumb activo usa proporción según imagen; opcional alinear contenedor principal con `catalog_format` para menos salto entre slides (nice-to-have).

### Categorías en home

- [`components/public/CategorySection.tsx`](components/public/CategorySection.tsx): miniaturas por categoría siguen usando **imagen** del thumbnail; puede quedar como está (no hay `ArtworkPublic` completo por ítem) o, si en el futuro el query pasa el campo, alinear. **Fuera del MVP** salvo que el query ya traiga una obra representativa con `catalog_format`.

### Admin: edición manual

- [`app/actions/artworks.ts`](app/actions/artworks.ts): `insert` / `update` en `createArtwork` y `updateArtwork` deben persistir `catalog_format` desde el form (default del form = `horizontal`).
- [`components/admin/ArtworkForm.tsx`](components/admin/ArtworkForm.tsx): control (select o radio) + Zod/defaultValues al crear/editar.
- **Lista admin** [`app/admin/(protected)/obras/page.tsx`](app/admin/(protected)/obras/page.tsx): el `select` es propio (no usa `ARTWORK_SELECT`); añadir columna solo si quieres columna/badge en tabla o filtro admin — **opcional**; el MVP puede ser solo formulario de edición.

### Importación masiva

- [`lib/import/bulk-import-core.ts`](lib/import/bulk-import-core.ts): en `.insert({...})` no hace falta enviar el campo si el default en BD es `horizontal` (borradores quedan horizontal hasta que Rick edite).
- Opcional fase 2: columna Excel + [`types/import.ts`](types/import.ts) si querés fijar vertical al importar.

### PDF catálogo y ficha

- [`app/api/catalogo/pdf/route.tsx`](app/api/catalogo/pdf/route.tsx): ya usa `ARTWORK_SELECT` — el tipo `ArtworkPublic` tendrá el campo; valorar si el layout de tarjeta en PDF debe usar `catalog_format` para caja de imagen (consistencia con web). Revisar componente interno del PDF en el mismo archivo o importado.
- [`app/api/artworks/[code]/ficha/route.tsx`](app/api/artworks/[code]/ficha/route.tsx): mismo criterio si hay rejilla de miniatura.

### Otros usos de `ARTWORK_SELECT`

- [`lib/supabase/queries/public.ts`](lib/supabase/queries/public.ts), [`lib/supabase/queries/wishlist.ts`](lib/supabase/queries/wishlist.ts), [`app/api/ai/generate-post/route.ts`](app/api/ai/generate-post/route.ts): solo heredan el campo al ampliar el select; **generate-post** podría mencionar el formato en el prompt (opcional).

### Páginas de categoría

- [`app/(public)/categoria/[slug]/page.tsx`](app/(public)/categoria/[slug]/page.tsx): usa `parseCatalogParams` — el filtro nuevo debe aplicarse igual que en `/catalogo`.

## Orden de implementación sugerido

1. Migración + tipos `database` / `artwork`.
2. `ARTWORK_SELECT` + server actions create/update + `ArtworkForm`.
3. `ArtworkCard` leyendo `catalog_format`.
4. `CatalogParams`, parser, `getFilteredArtworks`, `FilterSidebar`, `hasActiveFilters`, wiring en `CatalogClient` y página categoría.
5. Detalle (chip) y PDF si se desea paridad visual.
6. (Opcional) Admin tabla / import Excel.

## Notas

- **No** reutilizar `width_cm`/`height_cm` para inferir este campo; la columna es la fuente de verdad para UI y filtro.
- Mantener nombres de enum en **inglés** en código (`horizontal` / `vertical`) y etiquetas en español en UI (“Horizontal”, “Vertical”).
