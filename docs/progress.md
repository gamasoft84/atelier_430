# Atelier 430 — Avance del Proyecto

## Fase 0 — Setup técnico ✅ (2026-04-30)

### Completado

- [x] Next.js 16 + TypeScript + Tailwind CSS 4 inicializado
- [x] shadcn/ui configurado (16 componentes base instalados)
- [x] Dependencias instaladas: Supabase, Anthropic SDK, Cloudinary, Framer Motion, react-dropzone, Resend, react-hook-form, zod
- [x] `globals.css` — design tokens completos (colores, tipografía, variables shadcn)
- [x] `app/layout.tsx` — fuentes Sora + Playfair Display (Google Fonts)
- [x] `next.config.ts` — Cloudinary configurado en remotePatterns
- [x] `middleware.ts` — protección de rutas `/admin/*`
- [x] Estructura de carpetas: `lib/`, `types/`, `hooks/`, `components/`, `supabase/`
- [x] `lib/supabase/client.ts` + `server.ts` + `middleware.ts`
- [x] `lib/anthropic/client.ts` + `prompts.ts` + `generate.ts`
- [x] `lib/cloudinary/upload.ts` + `transform.ts`
- [x] `lib/utils.ts` (cn helper) + `lib/constants.ts`
- [x] `types/database.ts` — tipos del schema Supabase
- [x] `types/artwork.ts` — tipos del dominio
- [x] `types/api.ts` — tipos de requests/responses
- [x] `hooks/` — stubs de useWishlist, useFilters, useArtworks, useImageUpload
- [x] `.env.example` — template de variables de entorno
- [x] `supabase/migrations/001_initial_schema.sql` — schema completo con RLS
- [x] `.gitignore` actualizado (`.env.example` excluido del ignore)

### Variables de entorno configuradas
- ✅ Supabase (URL + anon key + service role)
- ✅ Cloudinary (cloud name + API key + secret + upload preset)
- ✅ Anthropic (API key + modelo claude-sonnet-4-6)
- ⏳ Resend (pendiente — necesario en Fase 7)
- ⏳ WhatsApp number (pendiente — necesario en Fase 4)

### Pendiente antes de avanzar
- [ ] Ejecutar `supabase/migrations/001_initial_schema.sql` en Supabase SQL Editor
- [ ] Verificar que el upload preset `atelier430_uploads` existe en Cloudinary

---

## Fase 1 — Autenticación y layout admin ✅ (2026-04-30)

### Completado

- [x] `app/admin/login/page.tsx` — página de login (fondo cream, card centrada)
- [x] `components/admin/LoginForm.tsx` — formulario con react-hook-form + zod, error handling
- [x] `app/admin/(protected)/layout.tsx` — layout protegido (verifica sesión, redirige si no autenticado)
- [x] `components/admin/AdminSidebar.tsx` — sidebar carbon-900 con 5 secciones y estado activo gold-500
- [x] `components/admin/AdminHeader.tsx` — header con email admin y botón de logout
- [x] `app/admin/(protected)/dashboard/page.tsx` — bienvenida + 4 cards de métricas + acciones rápidas
- [x] Páginas stub: obras, ventas, newsletter, configuración
- [x] `app/admin/page.tsx` — redirect automático a /admin/dashboard
- [x] Estructura de rutas: `(protected)` route group para separar login del layout protegido

### Arquitectura de autenticación
- Middleware (`middleware.ts`) como primera línea de defensa → redirige a `/admin/login` si no hay sesión
- Layout protegido como segunda verificación → doble seguridad
- Login page fuera del route group `(protected)` → sin bucle de redirección
- Logout: `supabase.auth.signOut()` desde cliente → redirect a `/admin/login`

### Cómo probar
1. `npm run dev`
2. Abrir `http://localhost:3000/admin/login`
3. Ingresar credenciales de Supabase Auth
4. Verificar redirect a `/admin/dashboard`
5. Probar navegación en sidebar
6. Probar logout

---

## Fase 2 — CRUD de obras ✅ (2026-05-01)

### Completado

- [x] `hooks/useImageUpload.ts` — hook completo con XHR upload, progress, reorder, initialize, reset
- [x] `app/api/upload/sign/route.ts` — firma SHA1 para Cloudinary (server-side)
- [x] `app/api/upload/route.ts` — DELETE de imágenes en Cloudinary
- [x] `components/admin/ImageUploader.tsx` — drag & drop, clipboard paste, reorder dnd-kit, thumbnails con progress bar
- [x] `app/actions/artworks.ts` — 7 server actions: createArtwork, updateArtwork, deleteArtwork, sellArtwork, reserveArtwork, toggleArtworkVisibility, generateArtworkCode
- [x] `components/admin/ArtworkForm.tsx` — wizard 5 pasos (imágenes → básicos → contenido → precio → publicar)
- [x] `app/admin/(protected)/obras/nueva/page.tsx` — página crear obra
- [x] `app/admin/(protected)/obras/page.tsx` — listado con filtros por búsqueda, categoría y estado; paginación 20/página
- [x] `components/admin/ArtworksFilters.tsx` — filtros client-side con debounce 400ms
- [x] `components/admin/ArtworksTable.tsx` — tabla server component con thumbnails Cloudinary, badges de estado/categoría
- [x] `app/admin/(protected)/obras/[id]/page.tsx` — página editar obra con datos precargados
- [x] `components/admin/DeleteArtworkDialog.tsx` — modal confirmación eliminar (controlled + uncontrolled)
- [x] `components/admin/SellArtworkDialog.tsx` — modal registrar venta (precio, canal, comprador)
- [x] `components/admin/ArtworkActionsMenu.tsx` — dropdown por fila: editar, vender, ocultar/mostrar, eliminar

### Arquitectura de imágenes
- Upload directo a Cloudinary con firma SHA1 generada en servidor (api_secret nunca expuesto)
- XHR para progreso en tiempo real por imagen
- dnd-kit para reordenar thumbnails
- Fire-and-forget DELETE al eliminar imágenes o obras

### Fixes técnicos
- `database.ts` reescrito con tipos explícitos (Insert/Update sin Omit circular) + `Relationships` + `CompositeTypes` para `@supabase/supabase-js@2.105`
- `useImageUpload`: `doneImages` envuelto en `useMemo` para evitar infinite re-render loop
- `ArtworkFormData.code` opcional (se auto-genera en server action)
- `zodResolver` con 3 generics para `@hookform/resolvers@5.x`

### Cómo probar
1. `npm run dev`
2. `/admin/obras` → listado vacío con botón "Nueva obra"
3. `/admin/obras/nueva` → wizard 5 pasos, subir imagen, publicar
4. Tabla: badge de estado, thumbnail, menú de acciones (⋯)
5. Menú: editar, registrar venta, ocultar/mostrar, eliminar

---

## Fase 3 — Integración IA ✅ (2026-05-01)

### Completado

- [x] `app/api/ai/generate-content/route.ts` — genera título, descripción, tags, subcategoría con Claude Vision
- [x] Botón "Generar con IA" activo en ArtworkForm paso 2 (spinner + estado "Regenerar" post-generación)
- [x] `lib/anthropic/services/artwork-analysis.ts` — servicio core reutilizable
- [x] Sugerencia de precio por IA: 3 niveles (venta rápida / recomendado / premium) con márgenes configurables
- [x] Tarjetas de precio en Step 2 → pre-llenan campo de precio en Step 3 con badge "Sugerido por IA"
- [x] Auto-fill para categoría "religiosa": 55×65 cm, técnica "impresion", marco activado
- [x] Subcategorías de religiosa con slugs: virgen_guadalupe, san_charbel, san_judas_tadeo, san_miguel_arcangel, la_sagrada_familia, la_ultima_cena
- [x] Selects de técnica y subcategoría en modo controlado (value= en lugar de defaultValue=)

### Mejora quirúrgica — Clasificación inteligente ✅ (2026-05-02)

- [x] `types/classification.ts` — ClassificationResult + AutoFillResult
- [x] `lib/anthropic/prompts.ts` — CLASSIFICATION_PROMPT con instrucciones estrictas por categoría
- [x] `lib/anthropic/services/artwork-classifier.ts` — classifyArtwork() con validación Zod, reutilizable en Fase 6
- [x] `lib/utils/artwork-autofill.ts` — applyAutoFill() con reglas de negocio (técnica automática, defaults religiosa)
- [x] `app/api/ai/classify-artwork/route.ts` — POST con auth + validación Zod
- [x] ArtworkForm Step 1: botón "Pre-llenar con IA", badge de confianza verde/amarillo, loading state

### Pendiente Fase 3
- [ ] API route `/api/ai/generate-post` — genera posts para redes sociales
- [ ] Modal generador de posts desde ficha de obra

---

## Fase 4 — Catálogo público ⏳ (Sesión 1 completada 2026-05-02)

### Sesión 1 ✅

- [x] `lib/supabase/queries/public.ts` — queries públicas: count, featured, category stats, by code, related, show_prices
- [x] `app/(public)/layout.tsx` — layout público independiente del admin
- [x] `components/public/PublicHeader.tsx` — header sticky con logo y nav mínima
- [x] `components/public/PublicFooter.tsx` — footer dark con contacto y sociales
- [x] `components/public/WhatsAppFloat.tsx` — botón flotante sticky bottom-right
- [x] `app/(public)/page.tsx` — home: hero con contador dinámico, obras destacadas (8), sección por categorías
- [x] `components/public/ArtworkCard.tsx` — card con hover overlay, badge status, precio condicional
- [x] `components/public/CategorySection.tsx` — 4 cards con imagen de fondo y contador
- [x] `app/(public)/catalogo/page.tsx` — grid completo sin filtros (Sesión 2), estado vacío amigable
- [x] `app/(public)/catalogo/[code]/page.tsx` — detalle: galería, specs, precio, CTAs, obras relacionadas
- [x] `components/public/ArtworkGallery.tsx` — galería client con thumbnails y zoom hover
- [x] `components/public/WhatsAppButton.tsx` — mensaje pre-llenado: código, título, medidas, precio, URL
- [x] `components/public/ShareButton.tsx` — dropdown: WA share, FB share, copiar enlace
- [x] `components/public/RelatedArtworks.tsx` — 4 obras de la misma categoría
- [x] Breadcrumb, badge VENDIDA/RESERVADA, metadata básica SEO

### Sesión 2 ✅ (2026-05-02)

- [x] `types/catalog.ts` — CatalogParams, parseCatalogParams, hasActiveFilters
- [x] `lib/supabase/queries/catalog.ts` — getFilteredArtworks (filtros DB + size filter JS) + getPriceRange
- [x] `components/public/catalog/FilterSidebar.tsx` — sidebar sticky desktop + drawer mobile
- [x] `components/public/catalog/CatalogClient.tsx` — wrapper client con estado mobile
- [x] `components/public/catalog/CatalogToolbar.tsx` — búsqueda debounced 300ms, sort, contador, limpiar
- [x] `components/public/catalog/Pagination.tsx` — paginación con URL como source of truth
- [x] `components/public/catalog/EmptyState.tsx` — sin resultados + catálogo vacío
- [x] `app/(public)/catalogo/page.tsx` — reescrito como Server Component con searchParams
- [x] `app/(public)/categoria/[slug]/page.tsx` — 4 páginas de categoría con filtros contextualizados
- [x] SEO: OG + Twitter cards completos en detalle de obra
- [x] Schema.org JSON-LD (Product) en detalle de obra
- [x] `app/sitemap.ts` — sitemap dinámico con todas las obras disponibles
- [x] `app/robots.ts` — permite todo excepto /admin/
- [x] `app/not-found.tsx` — 404 personalizado con layout público
- [x] `app/(public)/catalogo/error.tsx` — error boundary con Reintentar
- [x] Animaciones Framer Motion: stagger 40ms por card, fade+slide entrada
- [x] metadata base mejorada en root layout (metadataBase, OG, Twitter, robots)

### Pendiente (post Fase 4)
- [ ] Contador de vistas (incrementar views_count al entrar al detalle)
- [ ] Contador de clicks de WhatsApp (incrementar whatsapp_clicks)

---

## Fase 5 — Wishlist ⏳

- [ ] Hook useWishlist (localStorage + DB)
- [ ] Sincronización por session_id
- [ ] Página /favoritos
- [ ] Compartir wishlist

---

## Fase 6 — Carga masiva e importación bulk ⏳ (Sesión 1 completada 2026-05-02)

### Sesión 1 ✅

- [x] `types/import.ts` — ImportCategory, ImportTechnique, ExcelRowData, ValidatedRow, ValidationSummary, EXCEL_COLUMN_DEFS
- [x] `components/admin/AdminSidebar.tsx` — sub-item "Importar masivo" (FileSpreadsheet, /admin/obras/importar)
- [x] `app/admin/(protected)/obras/importar/page.tsx` — página Server Component con metadata
- [x] `components/admin/import/ImportWizard.tsx` — wizard 3 pasos con stepper vertical (Paso 3 locked)
- [x] `components/admin/import/TemplateStep.tsx` — Paso 1: descarga plantilla + convención de códigos
- [x] `app/api/template/excel/route.ts` — GET genera .xlsx con exceljs (auth requerida)
  * Hoja "Obras": headers dorado/carbón, dropdowns en B/D/G/H, validaciones numéricas, 3 filas de ejemplo
  * Hoja "Instrucciones": guía de llenado formateada
  * Hoja "Resumen": fórmulas de conteo, suma de costos/precios, margen estimado
- [x] `app/actions/import.ts` — validateImportFile() server action (xlsx server-side, check BD codes)
- [x] `components/admin/import/ValidatorStep.tsx` — Paso 2: drop zone + validación + preview
  * Validaciones por fila: code regex, category, technique, medidas, has_frame, cost, price
  * Detección de duplicados en archivo y en BD (warning, no error)
  * Tabla con toggle "solo errores", stats (total/válidas/errores/warnings)
  * CTA habilitado solo si no hay errores

### Pendiente Sesión 2
- [ ] Subida de ZIP de imágenes con react-dropzone
- [ ] Procesamiento batch con IA (reutiliza classifyArtwork() de Fase 3)
- [ ] Inserción masiva en Supabase como borradores
- [ ] Vista de revisión de borradores generados
- [ ] Publicación masiva desde la vista de revisión

---

## Fase 7 — Newsletter y posts ⏳

- [ ] Form de suscripción
- [ ] Integración Resend
- [ ] Templates de email
- [ ] Generador de posts para redes

---

## Fase 8 — PDF y dashboard completo ⏳

- [ ] Generación de PDF con @react-pdf/renderer
- [ ] Dashboard con métricas reales
- [ ] Gráficas de ventas (Recharts)

---

## Fase 9 — Pulido y deploy final ⏳

- [ ] Animaciones Framer Motion
- [ ] Optimización de imágenes
- [ ] Testing en mobile
- [ ] Dominio personalizado
- [ ] Google Analytics
- [ ] Sitemap y robots.txt
