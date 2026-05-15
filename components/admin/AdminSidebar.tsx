"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ImageIcon,
  FileSpreadsheet,
  ClipboardList,
  Images,
  ShoppingBag,
  Mail,
  BarChart3,
  LayoutTemplate,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  sub?: boolean
  exactMatch?: boolean
}

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/obras", label: "Obras", icon: ImageIcon, exactMatch: true },
  { href: "/admin/obras/carga-masiva", label: "Carga de fotos", icon: Images, sub: true },
  { href: "/admin/obras/importar", label: "Importar Excel+ZIP", icon: FileSpreadsheet, sub: true },
  { href: "/admin/obras/importar/revision", label: "Revisar borradores", icon: ClipboardList, sub: true },
  { href: "/admin/ventas", label: "Ventas", icon: ShoppingBag },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/admin/comparativo", label: "Comparativo", icon: LayoutTemplate },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (item: NavItem) => {
    if (item.href === "/admin/obras/importar/revision") {
      return pathname.startsWith("/admin/obras/importar/revision")
    }
    if (item.href === "/admin/obras/importar") {
      return pathname === "/admin/obras/importar"
    }
    if (item.exactMatch) {
      return pathname === item.href || (
        pathname.startsWith(item.href + "/") &&
        !pathname.startsWith("/admin/obras/importar") &&
        !pathname.startsWith("/admin/obras/carga-masiva")
      )
    }
    return pathname === item.href || pathname.startsWith(item.href + "/")
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-carbon-900 flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/8">
        <span className="text-white font-display text-lg font-semibold tracking-wide">
          Atelier 430
        </span>
        <p className="text-white/35 text-xs mt-0.5">Administración</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md text-sm font-medium transition-colors duration-150",
                item.sub ? "px-3 py-2 pl-8" : "px-3 py-2.5",
                active
                  ? "bg-gold-500/15 text-gold-400"
                  : "text-white/55 hover:text-white hover:bg-white/6"
              )}
            >
              <item.icon size={item.sub ? 15 : 17} strokeWidth={active ? 2 : 1.75} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/8">
        <p className="text-white/20 text-xs">Fase 1 · MVP</p>
      </div>
    </aside>
  )
}
