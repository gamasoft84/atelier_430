# CLAUDE.md — Contexto del Proyecto Atelier 430

> Este archivo proporciona contexto persistente a Claude Code sobre el proyecto.
> **Léelo siempre antes de hacer cambios.**

---

## 👤 Sobre el desarrollador

- **Nombre:** Rick
- **Empresa:** Gamasoft IA Technologies S.A.S.
- **Rol:** Founder y desarrollador único
- **Idioma preferido:** Español (México) para comunicación, inglés para nombres de variables/funciones
- **Otro proyecto activo:** InmoIA (SaaS de bienes raíces) - mismo stack tecnológico

---

## 🎨 Sobre el proyecto

**Atelier 430** es una galería digital privada para administrar y vender un inventario de 430 obras de arte (liquidación de fábrica antes vendida en Liverpool y Palacio de Hierro).

### Modelo de negocio
- B2C por WhatsApp (no e-commerce con checkout)
- B2B con catálogo PDF para decoradoras y mueblerías
- Solo Rick es admin (galería privada de un solo dueño)

### Inventario
- 220 nacionales (paisajes óleo)
- 96 europeas (reproducciones clásicas óleo)
- 41 modernas (óleo)
- 77 religiosas (impresiones)
- 201 con marco / 229 solo bastidor

---

## 🛠️ Stack Tecnológico (NO cambiar sin discutir)

```yaml
Frontend:
  framework: Next.js 14 (App Router)
  language: TypeScript (strict mode)
  styling: Tailwind CSS
  components: shadcn/ui
  fonts:
    - Sora (UI principal)
    - Playfair Display (títulos de obras)
  icons: lucide-react
  forms: react-hook-form + zod
  animations: framer-motion

Backend:
  database: Supabase (PostgreSQL + Auth)
  storage: Cloudinary (imágenes principales)
  ai: Anthropic Claude API
    model: claude-sonnet-4-6
  email: Resend
  hosting: Vercel

DevTools:
  package_manager: npm
  linter: ESLint
  formatter: Prettier
  git: conventional commits
```

---

## 📁 Estructura del proyecto

Sigue la estructura definida en `docs/design-system.md`. NO crees archivos fuera de esa estructura sin discutirlo.

Carpetas clave:
- `app/(public)/` — Rutas públicas
- `app/admin/` — Panel admin protegido
- `app/api/` — API routes
- `components/public/` — Componentes públicos
- `components/admin/` — Componentes admin
- `components/ui/` — shadcn/ui base
- `lib/` — Utilidades (supabase, cloudinary, anthropic, etc.)
- `types/` — Tipos TypeScript
- `hooks/` — Custom hooks

---

## 🎨 Design System (resumen)

### Paleta de colores
```css
--gold-500: #B8860B      /* Dorado envejecido (CTAs) */
--gold-400: #DAA520      /* Dorado brillante (hover) */
--carbon-900: #0F0F0F    /* Negro carbón (textos) */
--cream: #FAF7F0         /* Fondo principal */
--stone-600: #57534E     /* Texto secundario */
```

### Tipografía
- **UI:** Sora (font-sans)
- **Títulos de obras:** Playfair Display (font-display)

### Filosofía visual
- Minimalista — el arte es el protagonista
- Galería editorial, no e-commerce
- Mucho espacio en blanco
- Sin emojis en UI (ni en botones, ni en headers)
- Tonos cálidos (cream, dorado) sobre fríos

---

## ✍️ Convenciones de código

### Nombres
- **Componentes:** PascalCase (`ArtworkCard.tsx`)
- **Funciones:** camelCase (`getArtworkBySlug`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_IMAGES_PER_ARTWORK`)
- **Tipos/Interfaces:** PascalCase con prefijo si aplica (`Artwork`, `ArtworkFormData`)
- **Archivos de página:** lowercase con guión (`obra-detalle/page.tsx`)

### TypeScript
- Modo estricto siempre
- Evitar `any` — usar `unknown` si necesario
- Tipos derivados de Supabase usando `Database` types
- Props de componentes con interface explícita

### Imports
- Path aliases: `@/components`, `@/lib`, `@/types`, `@/hooks`
- Orden: external → internal → relative
- Imports tipo separados: `import type { ... }`

### Componentes
- Functional components con arrow functions
- Props destructuradas
- Server components por default — `'use client'` solo si necesario
- Loading states y error boundaries siempre

### Estilos
- Solo Tailwind, NO CSS modules ni styled-components
- Variables CSS personalizadas en `globals.css`
- Mobile-first siempre
- Usar componentes shadcn/ui antes de crear desde cero

---

## 🗣️ Tono de voz del producto

Cuando generes copy o contenido para el sitio:
- Sofisticado pero accesible
- Cálido y narrativo
- Honesto (no inventar autores ni historias falsas)
- Cero superlativos vacíos ("increíble", "asombroso" están vetados)
- Español de México neutro

---

## 🚫 Cosas que NO hacer

- ❌ NO usar Python — todo es Next.js + TypeScript
- ❌ NO usar bases de datos diferentes a Supabase
- ❌ NO usar otros proveedores de IA (es Anthropic Claude exclusivamente)
- ❌ NO subir imágenes a Supabase Storage — todo va a Cloudinary
- ❌ NO crear sistemas de pagos en línea — venta es por WhatsApp
- ❌ NO usar localStorage para datos críticos (solo wishlist temporal)
- ❌ NO inventar features que no estén en el documento Design System
- ❌ NO instalar paquetes sin avisar primero

---

## ✅ Workflow esperado

### Al iniciar una sesión
1. Lee este `CLAUDE.md`
2. Revisa el `docs/design-system.md` si vas a tocar arquitectura
3. Verifica el estado actual con `git status`
4. Pregunta antes de cambios grandes

### Antes de implementar features
1. Confirma con Rick qué fase del plan estás abordando
2. Lista los archivos que vas a crear/modificar
3. Pide confirmación si hay decisiones de diseño no triviales

### Al hacer commits
- Formato: `tipo(scope): descripción corta`
- Tipos: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`, `test`
- En español o inglés (consistente)
- Ejemplos:
  - `feat(admin): agregar componente ImageUploader con drag & drop`
  - `fix(catalogo): corregir filtro de precio en mobile`
  - `chore: actualizar dependencias`

### Al terminar una fase
1. Hacer commit final
2. Actualizar el plan en `docs/progress.md`
3. Mostrar resumen de lo implementado a Rick
4. Preguntar antes de avanzar a la siguiente fase

---

## 🎯 Estado actual del proyecto

**Fase actual:** Fase 3 (Integración IA)

**Fases completadas:** 0 (Setup), 1 (Auth), 2 (CRUD obras)

**Próximos pasos:**
1. `app/api/ai/generate-content/route.ts` — genera título, descripción y tags con Claude Vision
2. Conectar botón "Generar con IA" en ArtworkForm paso 3
3. `app/api/ai/generate-post/route.ts` — genera posts para redes sociales
4. Modal generador de posts desde la ficha de obra

---

## 📚 Referencias del proyecto

- `docs/design-system.md` — Documento maestro completo
- `docs/photography-guide.md` — Guía de fotografía de obras
- `docs/progress.md` — Avance por fases
- `.env.example` — Variables de entorno requeridas

---

## 🆘 Cuando tengas dudas

Si no estás seguro de algo:
1. **Primero** revisa el documento Design System
2. **Después** pregunta a Rick antes de asumir
3. **Nunca** improvises features grandes sin confirmación

---

**Última actualización:** Abril 2026
**Mantenido por:** Rick + Claude Code
