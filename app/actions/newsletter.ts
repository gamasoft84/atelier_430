"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { resend } from "@/lib/resend/client"
import { welcomeEmailHtml } from "@/lib/resend/emails/welcome"

const schema = z.object({
  email: z.string().email("Email inválido"),
  name:  z.string().max(100).optional(),
})

export async function subscribeToNewsletter(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    name:  formData.get("name") || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { email, name } = parsed.data
  const supabase = await createClient()

  const { error: dbError } = await supabase
    .from("newsletter_subscribers")
    .insert({ email, name: name ?? null, status: "active" })

  if (dbError) {
    if (dbError.code === "23505") return { error: "Este email ya está suscrito" }
    return { error: "No se pudo completar la suscripción" }
  }

  resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to:      email,
    replyTo: process.env.RESEND_REPLY_TO,
    subject: "Bienvenido a Atelier 430",
    html:    welcomeEmailHtml(name),
  }).catch(() => {})

  return { success: true }
}
