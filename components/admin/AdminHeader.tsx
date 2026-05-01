"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

interface AdminHeaderProps {
  user: User
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <header className="h-13 bg-white border-b border-stone-200 flex items-center justify-end px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-sm text-stone-500 hidden sm:block">{user.email}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-stone-500 hover:text-carbon-900 hover:bg-stone-100 gap-1.5 h-8 px-3"
        >
          <LogOut size={14} />
          <span className="text-sm">Salir</span>
        </Button>
      </div>
    </header>
  )
}
