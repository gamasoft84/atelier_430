# 🎨 Atelier 430

> Galería digital privada para administrar y vender un inventario curado de 430 obras de arte.

**Proyecto bajo:** Gamasoft IA Technologies S.A.S.

---

## 📋 Sobre el proyecto

Atelier 430 es una plataforma web que permite:

- 🖼️ Catálogo público elegante con filtros y búsqueda
- 🛠️ Panel admin para gestionar inventario completo
- 🤖 Generación automática de títulos y descripciones con IA (Claude)
- 📤 Carga masiva de obras (Excel + ZIP) o individual
- ❤️ Sistema de wishlist sin registro
- 📧 Newsletter de nuevas obras
- 📄 Catálogo PDF descargable
- 📱 Generador de posts para redes sociales
- 💬 Cierre de ventas vía WhatsApp

---

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **UI:** shadcn/ui + Sora + Playfair Display
- **Backend:** Supabase (PostgreSQL + Auth)
- **Storage:** Cloudinary
- **IA:** Anthropic Claude API (claude-sonnet-4-5)
- **Email:** Resend
- **Deploy:** Vercel

---

## 🚀 Setup inicial

### Requisitos
- Node.js 20+
- npm 10+
- Cuentas en: Supabase, Cloudinary, Anthropic, Resend, Vercel

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd atelier430

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar migraciones de Supabase
npm run db:setup

# Iniciar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📁 Estructura del proyecto

```
atelier430/
├── app/                  # Rutas Next.js (App Router)
│   ├── (public)/         # Rutas públicas
│   ├── admin/            # Panel admin protegido
│   └── api/              # API routes
├── components/           # Componentes React
│   ├── public/           # Componentes públicos
│   ├── admin/            # Componentes admin
│   ├── ui/               # shadcn/ui base
│   └── shared/           # Compartidos
├── lib/                  # Utilidades y clientes
├── types/                # Tipos TypeScript
├── hooks/                # Custom hooks
├── public/               # Assets estáticos
└── docs/                 # Documentación del proyecto
```

---

## 🎯 Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Linter ESLint |
| `npm run typecheck` | Verificar tipos TypeScript |
| `npm run db:setup` | Crear tablas en Supabase |
| `npm run db:reset` | Reset de base de datos (dev) |

---

## 🔐 Variables de entorno

Ver `.env.example` para la lista completa.

**Críticas:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`

---

## 📚 Documentación

- [`docs/design-system.md`](./docs/design-system.md) — Especificación técnica completa
- [`docs/photography-guide.md`](./docs/photography-guide.md) — Guía de fotografía de obras
- [`CLAUDE.md`](./CLAUDE.md) — Contexto para Claude Code

---

## 📝 Licencia

Propiedad privada. Todos los derechos reservados.
**Gamasoft IA Technologies S.A.S.** © 2026
