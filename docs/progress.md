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

## Fase 1 — Autenticación y layout admin ⏳

- [ ] Login admin funcional (Supabase Auth)
- [ ] Layout admin con sidebar
- [ ] Dashboard esqueleto
- [ ] Rutas protegidas verificadas

---

## Fase 2 — CRUD de obras ⏳

- [ ] ImageUploader con drag & drop
- [ ] Form de crear obra (paso a paso)
- [ ] Listado admin con filtros
- [ ] Edición de obra
- [ ] Modal de venta
- [ ] Modal de apartar

---

## Fase 3 — Integración IA ⏳

- [ ] API route `/api/ai/generate-content`
- [ ] Botón "Generar con IA" en form
- [ ] API route `/api/ai/generate-post`
- [ ] Generador de posts (modal con 3 versiones)

---

## Fase 4 — Catálogo público ⏳

- [ ] Layout público (header + footer)
- [ ] Home con hero + grid de destacadas
- [ ] Catálogo con filtros y ordenamiento
- [ ] Página de detalle de obra
- [ ] Botón WhatsApp dinámico
- [ ] SEO (meta tags dinámicos)

---

## Fase 5 — Wishlist ⏳

- [ ] Hook useWishlist (localStorage + DB)
- [ ] Sincronización por session_id
- [ ] Página /favoritos
- [ ] Compartir wishlist

---

## Fase 6 — Carga masiva e importación bulk ⏳

- [ ] BulkUploader (drag & drop 20-50 fotos)
- [ ] BulkImporter (Excel + ZIP)
- [ ] Procesamiento en background con IA
- [ ] Vista de revisión de borradores

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
