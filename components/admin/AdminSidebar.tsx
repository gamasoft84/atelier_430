"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ImageIcon,
  ShoppingBag,
  Mail,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/obras", label: "Obras", icon: ImageIcon },
  { href: "/admin/ventas", label: "Ventas", icon: ShoppingBag },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()

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
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-gold-500/15 text-gold-400"
                  : "text-white/55 hover:text-white hover:bg-white/6"
              )}
            >
              <Icon size={17} strokeWidth={isActive ? 2 : 1.75} />
              {label}
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
