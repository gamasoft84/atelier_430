"use client"

import { useRef, useState, useTransition } from "react"
import { subscribeToNewsletter } from "@/app/actions/newsletter"
import { Loader2 } from "lucide-react"

export default function NewsletterForm() {
  const [state, setState]     = useState<"idle" | "success" | "error">("idle")
  const [errorMsg, setErrMsg] = useState("")
  const [isPending, start]    = useTransition()
  const formRef               = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const result = await subscribeToNewsletter(fd)
      if ("error" in result) {
        setErrMsg(result.error)
        setState("error")
      } else {
        setState("success")
        formRef.current?.reset()
      }
    })
  }

  if (state === "success") {
    return (
      <div className="rounded-xl bg-gold-50 border border-gold-500/20 px-6 py-5 text-center">
        <p className="text-sm font-medium text-gold-700">Ya estás en la lista.</p>
        <p className="text-xs text-gold-600 mt-1">
          Te avisaremos cuando haya obras nuevas o precios especiales.
        </p>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
      <input
        type="email"
        name="email"
        required
        placeholder="tu@email.com"
        className="flex-1 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm
                   text-carbon-900 placeholder:text-stone-400
                   focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500
                   transition-colors"
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold-500
                   hover:bg-gold-400 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold
                   text-white transition-colors whitespace-nowrap"
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
        Suscribirme
      </button>

      {state === "error" && (
        <p className="w-full text-xs text-red-500 mt-1 sm:col-span-2">{errorMsg}</p>
      )}
    </form>
  )
}
