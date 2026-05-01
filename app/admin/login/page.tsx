import type { Metadata } from "next"
import LoginForm from "@/components/admin/LoginForm"

export const metadata: Metadata = {
  title: "Acceso",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-carbon-900 tracking-wide">Atelier 430</h1>
          <p className="text-stone-500 text-sm mt-1.5">Panel de administración</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-8">
          <h2 className="text-base font-semibold text-carbon-900 mb-6">Iniciar sesión</h2>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          Acceso exclusivo para administradores
        </p>
      </div>
    </div>
  )
}
