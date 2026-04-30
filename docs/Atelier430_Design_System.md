# 🎨 ATELIER 430 — Design System & Especificación Técnica

> **Galería digital privada para administración y venta de 430 obras de arte**
> Proyecto bajo: **Gamasoft IA Technologies S.A.S.**
> Versión: 1.0 · MVP
> Fecha: Abril 2026

---

## 📋 Tabla de Contenidos

1. Visión del Producto
2. Identidad de Marca
3. Stack Técnico
4. Design System (Colores, Tipografía, Componentes)
5. Arquitectura de Datos (Supabase + SQL)
6. Estructura de Carpetas
7. Funcionalidades MVP (Detalladas)
8. Sistema de IA (Anthropic Claude)
9. Sistema de Carga de Imágenes
10. Flujos de Usuario
11. Variables de Entorno
12. Plan de Desarrollo por Fases
13. Master Prompt para Claude Code

---

## 1. 🎯 Visión del Producto

### Misión
Crear una galería digital exclusiva que permita administrar, mostrar y vender un inventario de 430 obras de arte de manera profesional, eficiente y atractiva.

### Modelo de negocio
- **B2C** (consumidor final) — venta directa por WhatsApp
- **B2B** (decoradoras, mueblerías) — catálogo PDF + atención personalizada
- **Cierre por WhatsApp** (no e-commerce todavía)

### Usuarios

| Rol | Descripción | Cantidad |
|---|---|---|
| **Admin** | Rick (único administrador) | 1 |
| **Visitante público** | Compradores, decoradoras, curiosos | ∞ |
| **Suscriptor newsletter** | Clientes que quieren ser notificados | crece |

### Diferenciadores
- Catálogo curado de **430 piezas únicas**
- Cada obra con **historia generada por IA** (no descripciones genéricas)
- **Liquidación de fábrica** — narrativa de exclusividad
- **Calidad de tienda departamental** (Liverpool/Palacio de Hierro)

---

## 2. 🎨 Identidad de Marca

### Nombre
**Atelier 430**

### Significado
- "Atelier" → estudio/taller de artista (francés, evoca exclusividad europea)
- "430" → el número exacto del lote inicial, genera curiosidad y narrativa única

### Tagline (opciones)
- *"Cada obra, una historia única"*
- *"430 piezas. Una sola colección."*
- *"Arte curado, listo para tu hogar"*

### Tono de voz
- **Sofisticado pero accesible** — no intimida por precio
- **Cálido y narrativo** — cada obra tiene historia
- **Honesto** — transparencia sobre origen y técnica
- **Cero superlativos vacíos** — "increíble", "asombroso" están vetados

### Logo (concepto inicial)
- Tipografía: **Sora** (Bold) o **Playfair Display** (para acento serif)
- Símbolo opcional: marco minimalista cuadrado con el "430" sutil dentro
- Colores: dorado envejecido + negro carbón

---

## 3. 🛠️ Stack Técnico

### Frontend
| Tecnología | Versión | Propósito |
|---|---|---|
| Next.js | 14 (App Router) | Framework principal |
| TypeScript | 5+ | Tipado |
| Tailwind CSS | 3+ | Estilos |
| shadcn/ui | latest | Componentes base |
| Sora | Google Fonts | Tipografía principal |
| Playfair Display | Google Fonts | Tipografía de acento (títulos de obras) |
| Lucide React | latest | Iconos |
| react-dropzone | latest | Drag & drop de imágenes |
| Framer Motion | latest | Animaciones sutiles |

### Backend & Servicios
| Servicio | Propósito |
|---|---|
| **Supabase** | PostgreSQL, Auth (solo admin), Storage de respaldo |
| **Cloudinary** | Storage principal de imágenes + optimización |
| **Anthropic Claude API** (`claude-sonnet-4-5`) | Generación de títulos y descripciones |
| **Resend** | Newsletter y notificaciones |
| **Vercel** | Hosting y deploy |
| **Twilio WhatsApp** (futuro) | Notificaciones automáticas (Fase 2) |

### Justificación clave: Cloudinary vs Supabase Storage
**Cloudinary gana** por:
- Optimización automática WebP/AVIF (calidad de imagen vende arte)
- Transformaciones on-the-fly (thumbnails, watermarks)
- CDN global
- 25 GB gratis (cabes con holgura: 430 obras × ~8 MB = 3.5 GB)

---

## 4. 🎨 Design System

### Paleta de colores

```css
/* Primarios — inspirados en marcos dorados envejecidos y galerías */
--gold-500: #B8860B;      /* Dorado envejecido (CTAs principales) */
--gold-400: #DAA520;      /* Dorado brillante (hover) */
--gold-100: #F5E6C8;      /* Dorado claro (fondos suaves) */

/* Neutros — para que el arte sea protagonista */
--carbon-900: #0F0F0F;    /* Negro carbón (textos principales) */
--carbon-800: #1A1A1A;    /* Fondo dark mode */
--carbon-700: #2D2D2D;    /* Bordes oscuros */
--stone-600: #57534E;     /* Texto secundario */
--stone-400: #A8A29E;     /* Placeholders */
--stone-200: #E7E5E4;     /* Bordes claros */
--stone-100: #F5F5F4;     /* Fondos sutiles */
--cream: #FAF7F0;         /* Fondo principal — evoca lienzo */
--white: #FFFFFF;

/* Estados */
--success: #15803D;       /* Vendido (badge verde sutil) */
--warning: #B45309;       /* Apartado (ámbar) */
--error: #991B1B;         /* Errores */
--info: #1E40AF;          /* Información */

/* Categorías (badges) */
--cat-religiosa: #7C2D12;  /* Borgoña */
--cat-nacional: #166534;   /* Verde oliva */
--cat-europea: #1E3A8A;    /* Azul profundo */
--cat-moderna: #581C87;    /* Púrpura */
```

### Tipografía

```css
/* Tipografía principal (UI) */
font-family-base: 'Sora', system-ui, sans-serif;

/* Tipografía de acento (títulos de obras, hero) */
font-family-display: 'Playfair Display', Georgia, serif;

/* Escala */
--text-xs: 0.75rem;     /* 12px - metadata */
--text-sm: 0.875rem;    /* 14px - secundarios */
--text-base: 1rem;      /* 16px - body */
--text-lg: 1.125rem;    /* 18px - destacados */
--text-xl: 1.25rem;     /* 20px - subtítulos */
--text-2xl: 1.5rem;     /* 24px - títulos sección */
--text-3xl: 1.875rem;   /* 30px - títulos página */
--text-4xl: 2.25rem;    /* 36px - hero secundario */
--text-5xl: 3rem;       /* 48px - hero principal */
--text-6xl: 3.75rem;    /* 60px - hero impactante */

/* Pesos */
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Espaciado y layout

```css
/* Grid de catálogo */
--grid-mobile: 1 columna
--grid-tablet: 2 columnas
--grid-desktop: 3 columnas
--grid-wide: 4 columnas (>1440px)

/* Contenedores */
--max-width-content: 1280px
--max-width-prose: 720px
--padding-x-mobile: 1rem
--padding-x-desktop: 2rem

/* Aspect ratios */
--aspect-artwork-card: 4/5      /* Tarjeta en grid */
--aspect-artwork-detail: auto    /* Mantener proporciones reales */
--aspect-hero: 16/9
```

### Sombras y bordes

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
--shadow-artwork: 0 20px 40px -12px rgba(0,0,0,0.25);  /* Para hover de obras */

--radius-sm: 0.25rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
```

### Componentes principales

#### Artwork Card (Tarjeta de obra)
```
┌─────────────────────────┐
│                         │
│      [Imagen 4:5]       │
│                         │
│  [Badge categoría]      │ ← Esquina sup. izq.
│           [♡ wishlist]  │ ← Esquina sup. der.
└─────────────────────────┘
  Pastora del Valle           ← Playfair Display, 18px
  Óleo sobre lienzo · 60×80   ← Sora, 14px, stone-600
  $1,800 MXN                  ← Sora bold, 16px (si visible)
  [Consultar precio]          ← Si admin lo ocultó
```

#### Botón primario
- Fondo: `gold-500`
- Texto: `white`
- Hover: `gold-400`
- Padding: 12px 24px
- Border-radius: `radius-md`
- Font-weight: 600

#### Botón secundario
- Fondo: transparente
- Borde: `carbon-900`
- Texto: `carbon-900`
- Hover: fondo `carbon-900`, texto `cream`

#### Badge de estado
- **Disponible**: oculto (default)
- **Apartada**: ámbar suave, "RESERVADA"
- **Vendida**: gris oscuro, "VENDIDA" + overlay 50% sobre imagen

---

## 5. 🗄️ Arquitectura de Datos

### Tablas Supabase (PostgreSQL)

```sql
-- =============================================
-- TABLA: artworks (catálogo principal)
-- =============================================
CREATE TABLE artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,  -- R-001, E-015, N-042, M-008

  -- Contenido público
  title VARCHAR(200) NOT NULL,
  description TEXT,
  ai_generated BOOLEAN DEFAULT false,  -- Si fue generado por IA
  manually_edited BOOLEAN DEFAULT false,  -- Si el admin lo editó

  -- Categorización
  category VARCHAR(20) NOT NULL CHECK (category IN ('religiosa', 'nacional', 'europea', 'moderna')),
  subcategory VARCHAR(50),  -- paisaje, retrato, bodegón, abstracto, virgen_guadalupe, san_charbel...
  tags TEXT[],  -- ["paisaje", "rural", "puente", "verde"]

  -- Especificaciones físicas
  technique VARCHAR(50),  -- óleo, impresión, mixta, acrílico
  width_cm INTEGER,
  height_cm INTEGER,
  has_frame BOOLEAN DEFAULT false,
  frame_material VARCHAR(50),  -- pino, importada_europea, sin_marco
  frame_color VARCHAR(50),     -- dorado, negro, blanco, madera_natural

  -- Pricing
  price NUMERIC(10,2),
  original_price NUMERIC(10,2),  -- Para mostrar "antes/ahora"
  cost NUMERIC(10,2),  -- Lo que costó (privado, solo admin)
  show_price BOOLEAN DEFAULT true,  -- Override por obra (si admin oculta solo esta)

  -- Estado
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'hidden')),
  reserved_until TIMESTAMP,  -- Si está apartada, hasta cuándo
  reserved_by VARCHAR(100),  -- Nombre de quien apartó

  -- Datos de venta (privados)
  sold_at TIMESTAMP,
  sold_price NUMERIC(10,2),
  sold_channel VARCHAR(50),  -- marketplace, mercadolibre, whatsapp, presencial, otro
  sold_buyer_name VARCHAR(100),
  sold_buyer_contact VARCHAR(100),

  -- Logística (privado)
  location_in_storage VARCHAR(50),  -- "Estante A-3"
  admin_notes TEXT,

  -- Métricas
  views_count INTEGER DEFAULT 0,
  wishlist_count INTEGER DEFAULT 0,
  whatsapp_clicks INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP  -- Cuándo se hizo público
);

CREATE INDEX idx_artworks_status ON artworks(status);
CREATE INDEX idx_artworks_category ON artworks(category);
CREATE INDEX idx_artworks_price ON artworks(price);
CREATE INDEX idx_artworks_code ON artworks(code);

-- =============================================
-- TABLA: artwork_images (galería por obra)
-- =============================================
CREATE TABLE artwork_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  cloudinary_url TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  position INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  alt_text VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_images_artwork ON artwork_images(artwork_id);

-- =============================================
-- TABLA: wishlist (favoritos sin registro)
-- =============================================
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL,  -- Cookie/localStorage ID
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, artwork_id)
);

CREATE INDEX idx_wishlist_session ON wishlist_items(session_id);

-- =============================================
-- TABLA: newsletter_subscribers
-- =============================================
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  preferences JSONB DEFAULT '{"categories": ["all"]}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP
);

-- =============================================
-- TABLA: inquiries (consultas de WhatsApp opcional)
-- =============================================
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id),
  name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  message TEXT,
  source VARCHAR(50),  -- whatsapp, formulario, instagram
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed', 'converted')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TABLA: site_settings (configuración global)
-- =============================================
CREATE TABLE site_settings (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar settings iniciales
INSERT INTO site_settings (key, value) VALUES
  ('show_prices_globally', '{"enabled": true}'),
  ('total_inventory', '{"count": 430}'),
  ('contact_whatsapp', '{"phone": "+52XXXXXXXXXX"}'),
  ('hero_message', '{"title": "430 piezas. Una sola colección.", "subtitle": "Arte curado, listo para tu hogar"}');

-- =============================================
-- TABLA: import_jobs (tracking de importaciones bulk)
-- =============================================
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255),
  total_rows INTEGER,
  processed_rows INTEGER DEFAULT 0,
  successful_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error_log JSONB,
  metadata JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_import_jobs_status ON import_jobs(status);

-- =============================================
-- TABLA: admin_activity (log de acciones)
-- =============================================
CREATE TABLE admin_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50),  -- artwork_created, artwork_sold, price_updated, etc.
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Artworks: público puede ver disponibles/vendidas/apartadas, admin todo
CREATE POLICY "Public can view non-hidden artworks"
  ON artworks FOR SELECT
  USING (status != 'hidden');

CREATE POLICY "Admin full access to artworks"
  ON artworks FOR ALL
  USING (auth.uid() IS NOT NULL);  -- Solo usuarios autenticados (= admin)

-- Imágenes: público puede ver
CREATE POLICY "Public can view images"
  ON artwork_images FOR SELECT
  USING (true);

CREATE POLICY "Admin manages images"
  ON artwork_images FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Wishlist: cualquiera puede gestionar el suyo (por session_id)
CREATE POLICY "Anyone can manage own wishlist"
  ON wishlist_items FOR ALL
  USING (true);

-- Newsletter: insertar es público, gestionar solo admin
CREATE POLICY "Anyone can subscribe"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin manages subscribers"
  ON newsletter_subscribers FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Settings: público lee, admin escribe
CREATE POLICY "Public reads settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin writes settings"
  ON site_settings FOR ALL
  USING (auth.uid() IS NOT NULL);
```

---

## 6. 📁 Estructura de Carpetas (Next.js 14 App Router)

```
atelier430/
├── app/
│   ├── (public)/                    # Rutas públicas
│   │   ├── page.tsx                 # Home / hero + destacadas
│   │   ├── catalogo/
│   │   │   ├── page.tsx             # Catálogo con filtros
│   │   │   └── [code]/
│   │   │       └── page.tsx         # Detalle de obra
│   │   ├── categoria/[slug]/
│   │   │   └── page.tsx             # Listado por categoría
│   │   ├── favoritos/
│   │   │   └── page.tsx             # Wishlist
│   │   ├── nosotros/
│   │   │   └── page.tsx             # Historia de Atelier 430
│   │   ├── contacto/
│   │   │   └── page.tsx             # WhatsApp + formulario
│   │   └── layout.tsx               # Layout público (header/footer)
│   │
│   ├── admin/                       # Panel admin protegido
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Métricas
│   │   ├── obras/
│   │   │   ├── page.tsx             # Lista admin
│   │   │   ├── nueva/
│   │   │   │   └── page.tsx         # Crear obra individual (1 por 1)
│   │   │   ├── carga-masiva/
│   │   │   │   └── page.tsx         # Drag & drop múltiple (20-50)
│   │   │   ├── importar/
│   │   │   │   └── page.tsx         # Importación bulk Excel + ZIP
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Editar obra
│   │   ├── ventas/
│   │   │   └── page.tsx             # Historial de ventas
│   │   ├── newsletter/
│   │   │   └── page.tsx             # Suscriptores y campañas
│   │   ├── configuracion/
│   │   │   └── page.tsx             # Settings globales
│   │   └── layout.tsx               # Layout admin
│   │
│   ├── api/
│   │   ├── artworks/
│   │   │   ├── route.ts             # GET listado, POST crear
│   │   │   ├── [id]/route.ts        # GET, PATCH, DELETE
│   │   │   └── bulk-import/
│   │   │       ├── validate/route.ts    # Valida Excel
│   │   │       ├── process/route.ts     # Inicia procesamiento
│   │   │       └── status/route.ts      # Polling de progreso
│   │   ├── ai/
│   │   │   ├── generate-content/route.ts  # Genera título + descripción
│   │   │   └── generate-post/route.ts     # Post para redes
│   │   ├── upload/
│   │   │   ├── route.ts             # Sube a Cloudinary
│   │   │   └── zip/route.ts         # Procesa ZIP de imágenes
│   │   ├── newsletter/
│   │   │   └── subscribe/route.ts
│   │   ├── pdf/
│   │   │   └── catalogo/route.ts    # Genera PDF
│   │   ├── template/
│   │   │   └── excel/route.ts       # Descarga plantilla Excel
│   │   └── webhook/
│   │       └── cloudinary/route.ts
│   │
│   ├── globals.css
│   ├── layout.tsx                   # Root layout
│   └── not-found.tsx
│
├── components/
│   ├── ui/                          # shadcn/ui base
│   ├── public/
│   │   ├── Hero.tsx
│   │   ├── ArtworkCard.tsx
│   │   ├── ArtworkGrid.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── ArtworkDetail.tsx
│   │   ├── WhatsAppButton.tsx
│   │   ├── WishlistHeart.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── NewsletterForm.tsx
│   ├── admin/
│   │   ├── AdminHeader.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── ArtworkForm.tsx
│   │   ├── ImageUploader.tsx        # Drag & drop individual
│   │   ├── BulkUploader.tsx         # Carga masiva por drop (20-50)
│   │   ├── BulkImporter.tsx         # Importación Excel + ZIP (430)
│   │   ├── ExcelValidator.tsx       # Valida Excel antes de procesar
│   │   ├── ImportProgress.tsx       # Barra de progreso del bulk import
│   │   ├── AIGenerateButton.tsx
│   │   ├── PostGenerator.tsx
│   │   ├── SalesTable.tsx
│   │   └── DashboardCards.tsx
│   └── shared/
│       ├── Logo.tsx
│       └── PriceDisplay.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── cloudinary/
│   │   ├── upload.ts
│   │   └── transform.ts
│   ├── anthropic/
│   │   ├── client.ts
│   │   ├── prompts.ts
│   │   └── generate.ts
│   ├── pdf/
│   │   └── generate-catalog.ts
│   ├── utils.ts
│   └── constants.ts
│
├── types/
│   ├── artwork.ts
│   ├── database.ts
│   └── api.ts
│
├── hooks/
│   ├── useArtworks.ts
│   ├── useWishlist.ts
│   ├── useFilters.ts
│   └── useImageUpload.ts
│
├── public/
│   ├── logo.svg
│   ├── og-image.jpg
│   └── fonts/
│
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 7. ⚙️ Funcionalidades MVP (Detalladas)

### 7.1 Panel Público

#### Home (/)
- Hero impactante con frase principal: *"430 piezas. Una sola colección."*
- Contador dinámico: "X obras disponibles · Y vendidas"
- Grid de 8 obras destacadas (las más vistas o seleccionadas por admin)
- Sección "Por categoría" con 4 cards (Religiosa, Nacional, Europea, Moderna)
- Newsletter signup
- Footer con redes y WhatsApp

#### Catálogo (/catalogo)
- **Filtros laterales (sticky en desktop, modal en mobile):**
  - Categoría (checkbox múltiple)
  - Rango de precio (slider) — solo si precios visibles
  - Tamaño (chico < 50cm, mediano 50-80, grande 80-120, XL >120)
  - Con marco / Sin marco
  - Técnica (óleo, impresión, mixta)
  - Solo disponibles (toggle)
- **Ordenamiento:** Más recientes / Precio asc / Precio desc / Tamaño
- **Búsqueda** por código (R-001) o palabra clave
- **Grid responsivo:** 1/2/3/4 columnas
- **Paginación:** 24 por página o scroll infinito
- **URL con query params:** filtros sincronizados (compartibles)

#### Detalle de obra (/catalogo/[code])
- **Galería de imágenes** con zoom y swipe en mobile
- **Información:**
  - Título (Playfair Display, grande)
  - Categoría + técnica + medidas
  - Descripción completa generada por IA
  - Precio (o "Consultar precio")
- **CTAs:**
  - **Botón WhatsApp grande** con mensaje pre-llenado
  - **Botón Wishlist** (corazón)
  - **Compartir** (WhatsApp, Facebook, copiar link)
- **Estado:** Si está vendida, badge "VENDIDA" con overlay; si apartada, "RESERVADA"
- **Obras relacionadas** (misma categoría, 4 obras)
- **SEO:** meta tags dinámicos con título, descripción, og:image

#### Wishlist (/favoritos)
- Lista de obras guardadas (localStorage + DB con session_id)
- Mismo grid que catálogo
- Botón "Compartir mi wishlist" (genera link único)
- Botón "Consultar todas por WhatsApp"

### 7.2 Panel Admin

#### Login (/admin/login)
- Email + password (Supabase Auth)
- Solo Rick tiene credenciales

#### Dashboard (/admin/dashboard)
- **Cards de métricas:**
  - Inventario total / Disponible / Apartado / Vendido
  - Ingresos del mes / Acumulados
  - Ganancia neta (vs costo $90,000)
  - Obras más vistas (top 5)
- **Gráfica:** ventas por mes (últimos 6 meses)
- **Acciones rápidas:** "Subir nueva obra", "Carga masiva"

#### Lista de obras (/admin/obras)
- Tabla con: foto, código, título, categoría, precio, estado, fecha
- Filtros: estado, categoría, búsqueda
- **Acciones por obra:**
  - Editar
  - Marcar como vendida (modal con precio final + canal)
  - Apartar (modal con nombre + duración)
  - Ocultar/mostrar
  - Eliminar (con confirmación)
- **Acciones masivas:**
  - Cambiar precio % a múltiples
  - Cambiar estado masivo

### 🎯 Tres modalidades de carga de obras

El sistema soporta **3 formas distintas** de agregar obras según la necesidad:

| Modalidad | Cuándo usarla | Tiempo por obra | Caso de uso |
|---|---|---|---|
| **Individual** | Obra nueva especial, atención detallada | 5-10 min | Adiciones futuras, piezas estrella |
| **Carga Masiva (drop)** | Bloque de 20-50 obras similares | 3-5 min | Lotes pequeños recurrentes |
| **Importación Bulk** | Carga inicial 430 obras | 30-60 seg | Setup inicial del catálogo |

---

#### A) Crear obra individual (/admin/obras/nueva)
**Para cuando quieres dedicar atención plena a una sola obra.**

- **Paso 1: Subir imágenes**
  - Drag & drop o click
  - Hasta 5 imágenes
  - Reordenar arrastrando
- **Paso 2: Datos básicos**
  - Categoría, subcategoría
  - Medidas (ancho × alto)
  - Técnica
  - Con marco / sin marco
  - Material y color del marco (si aplica)
- **Paso 3: Generar contenido con IA**
  - Botón "✨ Generar título y descripción"
  - Loading state
  - Resultado editable
  - Botón "Regenerar" si no le gusta
- **Paso 4: Precio y datos privados**
  - Precio público
  - Costo (privado)
  - Ubicación en bodega
  - Notas privadas
- **Paso 5: Publicar**
  - Vista previa
  - Botón "Publicar" o "Guardar como borrador"

---

#### B) Carga masiva por drop (/admin/obras/carga-masiva)
**Para subir lotes medianos (20-50 obras) con flujo guiado.**

- Drop zone gigante
- Sube hasta 50 fotos de una vez
- Genera borradores automáticamente
- Tabla de borradores: editar uno por uno o en serie
- Acciones masivas: aplicar categoría/precio a múltiples
- Botón "Generar IA para todos los seleccionados"
- Botón "Publicar todos los listos"

---

#### C) Importación Bulk desde Excel + ZIP (/admin/obras/importar)
**Para la carga inicial de las 430 obras o lotes muy grandes.**

**Flujo en 6 pasos:**

**Step 1: Descargar plantilla**
- Botón "📥 Descargar plantilla Excel"
- Excel con columnas pre-validadas y dropdowns
- Ejemplos llenados en las primeras 3 filas

**Step 2: Llenar plantilla (offline)**
- El admin llena la plantilla con todos los datos que solo él sabe:
  - Código (R-001, N-002, etc.)
  - Categoría, medidas, marco, técnica, costo, ubicación

**Step 3: Subir Excel**
- Drop zone para `.xlsx` o `.csv`
- Validación automática:
  - Códigos únicos
  - Categorías válidas
  - Medidas numéricas
  - Sin filas vacías
- Muestra preview con errores destacados en rojo

**Step 4: Subir ZIP de imágenes**
- Drop zone gigante para archivo `.zip`
- Naming convention requerido: `{código}-{posición}.jpg`
  - Ejemplo: `R-001-1.jpg`, `R-001-2.jpg`, `R-001-3.jpg`
- Sistema empareja automáticamente cada imagen con su obra por código
- Muestra: "✅ 1,247 imágenes detectadas para 430 obras"
- Alertas si hay obras sin foto o fotos huérfanas

**Step 5: Procesamiento automático con IA**
- Barra de progreso visual: `127/430 obras procesadas...`
- Para cada obra el sistema:
  1. Sube todas sus imágenes a Cloudinary en paralelo (lotes de 10)
  2. Envía la imagen principal + datos del Excel a Claude
  3. Claude detecta: subcategoría, color marco, estilo, paleta
  4. Claude genera: título, descripción, tags
  5. Crea registro en DB con estado `borrador`
- Tiempo estimado: 2-3 horas para 430 obras
- Email de notificación al terminar

**Step 6: Revisión y publicación**
- Vista de tabla con todos los borradores generados
- Filtros: "Pendientes de revisar", "Listos para publicar"
- Edición rápida en línea (título, descripción, precio)
- Acciones masivas:
  - "Aplicar precio sugerido a todos"
  - "Aprobar y publicar seleccionados"
  - "Regenerar IA para seleccionados"

**Características técnicas del importador:**
- Procesamiento en background (no bloquea la UI)
- Sistema de cola con reintentos automáticos
- Recuperación ante errores (si se cae, retoma donde iba)
- Log detallado descargable al final
- Validación pre-carga: estima costo de IA antes de procesar

#### Configuración (/admin/configuracion)
- **Toggle global:** Mostrar/ocultar precios en todo el sitio
- WhatsApp business number
- Mensaje del hero
- Redes sociales
- Email de contacto

### 7.3 Funcionalidades destacadas

#### Generador de posts para redes sociales
Un botón en cada obra que genera 3 versiones de post:
1. **Versión Instagram** — narrativa, emocional, con hashtags
2. **Versión Facebook Marketplace** — directo, técnico, precio claro
3. **Versión WhatsApp Status** — corto, con emojis, llamada a acción

Copia al clipboard con un click.

#### Newsletter de nuevas obras
- Captura email + nombre en home
- Preferencias por categoría (opcional)
- Admin puede mandar campañas desde panel:
  - Selecciona obras a destacar
  - IA genera el copy del email
  - Envía con Resend
- Templates pre-diseñados

#### Catálogo PDF descargable
- Botón en home "Descargar catálogo"
- Genera PDF con:
  - Portada con branding Atelier 430
  - Índice por categoría
  - 1 obra por página: foto grande, código, descripción, medidas, precio
  - Página de contacto al final
- Filtrable: "Solo religiosas", "Solo disponibles", etc.
- Usa `@react-pdf/renderer` o Puppeteer en API route

#### Sistema de wishlist
- Sin registro requerido
- Usa session_id en localStorage + DB para persistir
- Sincroniza entre dispositivos si el usuario da su email
- Compartible vía link único

---

## 8. 🤖 Sistema de IA (Anthropic Claude)

### Modelo a usar
**`claude-sonnet-4-5`** para generación de contenido (balance calidad/costo)

### Caso de uso 1: Generar título + descripción de obra

**Input que recibe Claude:**
- Imagen de la obra (base64 o URL)
- Categoría y subcategoría
- Medidas
- Técnica
- Si tiene marco

**Prompt template (`lib/anthropic/prompts.ts`):**

```typescript
export const ARTWORK_CONTENT_PROMPT = `
Eres un curador de arte especializado en crear descripciones evocadoras y comerciales para una galería en México llamada "Atelier 430".

CONTEXTO DE LA GALERÍA:
- Liquidación de fábrica de obras antes vendidas en Liverpool y Palacio de Hierro
- 430 piezas únicas: religiosas (impresiones), paisajes nacionales (óleo), reproducciones europeas clásicas (óleo), arte moderno (óleo)
- Cliente final: hogares mexicanos, decoradoras de interiores, mueblerías

TONO DE VOZ:
- Sofisticado pero accesible, no pretencioso
- Cálido y narrativo
- Honesto sobre que son obras comerciales (no únicas firmadas, excepto cuando aplica)
- Cero superlativos vacíos ("increíble", "asombroso" están vetados)
- Español de México neutro

DATOS DE LA OBRA:
- Categoría: {category}
- Subcategoría: {subcategory}
- Medidas: {width}cm x {height}cm
- Técnica: {technique}
- Con marco: {has_frame} ({frame_material} {frame_color})

INSTRUCCIONES:
Analiza la imagen adjunta y genera:

1. **Título** (máx 6 palabras): evocador, no genérico. Mal: "Paisaje con puente". Bien: "Puente al pueblo dormido"

2. **Descripción** (80-120 palabras): describe el estilo, paleta de colores, sensación que transmite, y sugiere un espacio ideal para colgarla (sala, recámara, oficina, comedor, etc.). NO inventes historia del autor ni datos no verificables.

3. **Tags** (5-8 palabras clave para SEO): conceptos visuales y temáticos.

FORMATO DE RESPUESTA (JSON estricto, sin texto adicional):
{
  "title": "...",
  "description": "...",
  "tags": ["tag1", "tag2", ...]
}
`;
```

### Caso de uso 2: Generar posts para redes sociales

```typescript
export const SOCIAL_POST_PROMPT = `
Genera 3 versiones de post para vender esta obra de arte de Atelier 430:

OBRA: {title}
DESCRIPCIÓN: {description}
PRECIO: {price}
CATEGORÍA: {category}
MEDIDAS: {width}x{height}cm
URL: {url}

Genera:

1. **INSTAGRAM** (max 220 caracteres + 8 hashtags):
   - Tono emocional, evocador
   - Pregunta o llamada a la imaginación
   - Hashtags relevantes (#arteenmexico #decoracion etc.)

2. **FACEBOOK MARKETPLACE** (max 400 caracteres):
   - Directo, técnico
   - Medidas, técnica, precio claro
   - "Mensaje al WhatsApp para más info"

3. **WHATSAPP STATUS** (max 100 caracteres):
   - Muy corto, con 2-3 emojis
   - Urgencia sutil

FORMATO JSON:
{
  "instagram": "...",
  "facebook": "...",
  "whatsapp": "..."
}
`;
```

### Caso de uso 3: Generar email de newsletter

Cuando admin selecciona obras nuevas para anunciar, IA genera el copy completo del email.

### Estimación de costos IA

- **Generación inicial (430 obras × 1 vez)**: ~$8-15 USD total
- **Posts redes (uso continuo)**: ~$0.005 por post
- **Newsletters**: ~$0.02 por email generado

**Presupuesto IA mensual estimado: $5-15 USD**

---

## 9. 📤 Sistema de Carga de Imágenes

### Flujo técnico

```
[Usuario arrastra/selecciona] → [react-dropzone valida]
   → [Compresión cliente con browser-image-compression]
   → [Upload directo a Cloudinary con signed URL]
   → [Cloudinary regresa URL + public_id]
   → [Guardar en Supabase artwork_images]
```

### Validaciones cliente
- Formatos: JPG, PNG, WebP, HEIC
- Tamaño máx: 10 MB por imagen
- Mínimo 1, máximo 5 por obra
- Resolución mínima recomendada: 1200×1200px

### Configuración Cloudinary
- Folder: `atelier430/artworks/{code}/`
- Transformaciones automáticas:
  - `thumbnail`: 400×500, c_fill, q_auto:eco
  - `card`: 600×750, c_fill, q_auto:good
  - `detail`: 1200×1500, c_fit, q_auto:good
  - `og`: 1200×630, c_fill, q_auto:good (para Open Graph)
- Watermark sutil en esquina (opcional, fase 2)

### Componente `<ImageUploader />`

**Características:**
- Zona de drop con feedback visual (border dashed → solid al hover)
- Lista de archivos cargándose con barra de progreso individual
- Miniaturas con botón eliminar
- Botón "Establecer como principal" en cada miniatura
- Reordenamiento drag-and-drop entre miniaturas
- Soporte de pegar desde portapapeles (Ctrl+V)
- Mensaje claro de errores

### Componente `<BulkUploader />` (Carga Express)

**Flujo:**
1. Drop zone para 50+ imágenes
2. Cada imagen → crea borrador con código auto-incremental
3. Lista de borradores con thumbnail
4. Edición rápida en línea: categoría, medidas, marco
5. Botón "Generar contenido IA para todos"
6. Revisión final → "Publicar todos"

---

## 10. 🔄 Flujos de Usuario

### Flujo Admin: Subir 50 obras en una sesión

1. Login en `/admin`
2. Sesión de fotografía previa (todas las obras ya fotografiadas)
3. Va a `/admin/obras/carga-masiva`
4. Arrastra 50 fotos → se crean 50 borradores
5. Selecciona "Categoría: Nacional" → aplica a todos los seleccionados
6. Edita medidas y marco en cada uno (3-4 min/obra)
7. Click "Generar IA para todos" → espera 2-3 minutos
8. Revisa títulos/descripciones, ajusta los que no convencen
9. Asigna precios masivamente con regla: "Nacionales con marco grande = $1,500"
10. Click "Publicar todos los listos"
11. ✅ 50 obras en línea en ~3 horas de trabajo

### Flujo Cliente: Comprar una obra

1. Llega a `atelier430.com` desde Instagram
2. Hero impactante captura atención
3. Click en "Ver catálogo"
4. Filtra: "Religiosa" + "Con marco"
5. Encuentra Virgen de Guadalupe
6. Click en la obra → vista detalle
7. Galería de fotos, lee descripción
8. Click corazón → guarda en wishlist
9. Click botón WhatsApp grande
10. Se abre WhatsApp con mensaje pre-llenado:
    ```
    ¡Hola Atelier 430! Me interesa la obra:
    🎨 R-012 - "Madre de las Américas"
    💰 $1,200 MXN
    🔗 atelier430.com/catalogo/r-012

    ¿Sigue disponible?
    ```
11. Rick contesta, cierra venta
12. Rick va al admin → marca obra como vendida → registra canal y precio final

### Flujo Cliente: Suscribirse a newsletter

1. En home ve sección "Sé el primero en ver nuevas obras"
2. Email + nombre + selecciona "Religiosa, Europea"
3. Recibe email de bienvenida (Resend)
4. Cuando Rick publica nuevas obras, recibe newsletter automático

---

## 11. 🔐 Variables de Entorno

```env
# Next.js
NEXT_PUBLIC_SITE_URL=https://atelier430.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=atelier430
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx
CLOUDINARY_UPLOAD_PRESET=atelier430_uploads

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx
ANTHROPIC_MODEL=claude-sonnet-4-5

# Resend
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=hola@atelier430.com

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=521XXXXXXXXXX

# Admin
ADMIN_EMAIL=rick@gamasoft.mx
```

---

## 12. 📅 Plan de Desarrollo por Fases

### Fase 0 — Setup (Día 1)
- [x] Crear repo Git
- [x] Inicializar Next.js 14 con TypeScript + Tailwind
- [x] Configurar shadcn/ui
- [x] Crear proyecto Supabase y ejecutar SQL
- [x] Crear cuenta Cloudinary y configurar preset
- [x] Configurar variables de entorno
- [x] Deploy inicial a Vercel

### Fase 1 — Modelos y autenticación (Días 2-3)
- [ ] Tipos TypeScript desde schema Supabase
- [ ] Cliente Supabase configurado
- [ ] Login admin funcional
- [ ] Layout admin con sidebar
- [ ] Middleware de protección de rutas

### Fase 2 — CRUD de obras (Días 4-7)
- [ ] Componente ImageUploader (drag & drop)
- [ ] Form de crear obra paso a paso
- [ ] Listado admin con filtros
- [ ] Edición de obra
- [ ] Eliminación con confirmación
- [ ] Marcado como vendida con modal

### Fase 3 — Integración IA (Días 8-9)
- [ ] Cliente Anthropic
- [ ] API route generate-content
- [ ] Botón en form: "Generar con IA"
- [ ] Manejo de errores y reintento

### Fase 4 — Catálogo público (Días 10-13)
- [ ] Layout público con header/footer
- [ ] Home con hero
- [ ] Catálogo con filtros y ordenamiento
- [ ] Página de detalle de obra
- [ ] Botón WhatsApp con mensaje dinámico
- [ ] SEO básico (meta tags)

### Fase 5 — Wishlist (Días 14-15)
- [ ] Hook useWishlist con localStorage
- [ ] Sincronización con DB
- [ ] Página /favoritos
- [ ] Compartir wishlist

### Fase 6 — Carga masiva e importación bulk (Días 16-18)
- [ ] BulkUploader component (drag & drop 20-50)
- [ ] BulkImporter component (Excel + ZIP)
- [ ] API route validate (validación de Excel)
- [ ] API route process (procesamiento en background)
- [ ] API route status (polling de progreso)
- [ ] Generación de plantilla Excel descargable
- [ ] Sistema de cola con reintentos
- [ ] Procesamiento IA en lote
- [ ] Vista de revisión de borradores

### Fase 7 — Newsletter y posts (Días 17-18)
- [ ] Form de suscripción
- [ ] Integración Resend
- [ ] Generador de posts redes (modal con 3 versiones)
- [ ] Templates de email

### Fase 8 — PDF y dashboard (Días 19-20)
- [ ] Generación de PDF con @react-pdf/renderer
- [ ] Dashboard con métricas
- [ ] Gráficas con Recharts

### Fase 9 — Pulido y deploy final (Días 21-22)
- [ ] Animaciones con Framer Motion
- [ ] Optimización de imágenes
- [ ] Testing en mobile
- [ ] Configurar dominio personalizado
- [ ] Google Analytics
- [ ] Sitemap y robots.txt

**TOTAL ESTIMADO: 22 días de desarrollo enfocado**

---

## 13. 🤖 Master Prompt para Claude Code

Guarda este prompt para iniciar el desarrollo con Claude Code:

```
Voy a desarrollar "Atelier 430", una galería digital privada para administrar y vender 430 obras de arte. Soy el único administrador. El proyecto vive bajo mi empresa Gamasoft IA Technologies S.A.S.

STACK:
- Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase (PostgreSQL, Auth)
- Cloudinary (imágenes)
- Anthropic Claude API (claude-sonnet-4-5) para generación de contenido
- Resend para emails
- Vercel para deploy

CONTEXTO DEL NEGOCIO:
- Compré un lote de 430 obras de arte por $90,000 MXN (liquidación de fábrica antes vendida en Liverpool/Palacio de Hierro)
- Distribución: 220 nacionales (paisajes óleo), 96 europeas (reproducciones óleo clásicas), 41 modernas (óleo), 77 religiosas (impresiones)
- 201 con marco, 229 solo bastidor
- Marcos de pino mexicano o importados europeos
- Vendo por WhatsApp (no e-commerce)

FUNCIONALIDADES MVP:
1. Catálogo público con filtros (categoría, precio, tamaño, marco)
2. Detalle de obra con galería + botón WhatsApp + wishlist
3. Panel admin protegido con dashboard de métricas
4. Crear/editar/eliminar obras con drag & drop de imágenes
5. Generación automática de título y descripción con IA
6. Carga masiva de obras
7. Marcado de vendidas con tracking de canal
8. Sistema de wishlist sin registro (localStorage + DB)
9. Newsletter con Resend
10. Generador de posts para redes (Instagram, Facebook, WhatsApp Status)
11. Catálogo PDF descargable
12. Toggle global para mostrar/ocultar precios

DESIGN SYSTEM:
- Colores: dorado envejecido (#B8860B) + carbón (#0F0F0F) + crema (#FAF7F0)
- Tipografía: Sora (UI) + Playfair Display (títulos de obras)
- Mobile-first
- Estética: galería minimalista que deja al arte ser protagonista

TONO DE VOZ:
- Sofisticado pero accesible
- Cálido y narrativo
- Honesto (no inventa autores ni historias falsas)

[Adjuntar el archivo Atelier430_Design_System.md]

Por favor revisa el documento adjunto y comienza con la Fase 0 (Setup). Al completar cada fase, espera mi confirmación antes de avanzar a la siguiente.
```

---

## 14. ⚠️ Consideraciones Legales

- **Términos y Condiciones** del sitio (decir que son reproducciones, no obra original firmada)
- **Aviso de Privacidad LFPDPPP** para newsletter y formularios
- **Política de devoluciones** clara (típicamente "no se aceptan devoluciones en obras de arte personalizado")
- **Condiciones de envío** (responsabilidad por daños en transporte)

> **Recomendación**: Igual que con InmoIA, hacer revisar por abogado mexicano antes de operar a escala.

---

## 15. 💡 Ideas Futuras (Fase 2+)

- **Realidad aumentada**: ver obra en tu pared con la cámara
- **Sistema de subastas** para obras especiales
- **Programa de referidos** para clientes
- **App móvil PWA** (igual que InmoIA)
- **Integración con MercadoLibre API** para sincronizar listados
- **Chatbot de WhatsApp** con Claude que responde consultas iniciales
- **Sistema de comisiones** si más adelante vendes obras de otros artistas

---

## 📞 Soporte y siguientes pasos

Una vez aprobado este documento, los siguientes deliverables serán:
1. HTML reference files de cada pantalla principal (estilo InmoIA)
2. Setup inicial del proyecto en repo Git
3. Migración SQL ejecutable en Supabase
4. Componentes base de shadcn/ui configurados

**Preparado por:** Claude (Anthropic)
**Para:** Rick - Gamasoft IA Technologies S.A.S.
**Versión:** 1.0
**Fecha:** Abril 2026
