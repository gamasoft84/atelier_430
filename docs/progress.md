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
