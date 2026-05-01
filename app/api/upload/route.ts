import { createHash } from "crypto"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { public_id } = (await request.json()) as { public_id: string }

  if (!public_id) {
    return NextResponse.json({ error: "Falta public_id" }, { status: 400 })
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET!
  const apiKey = process.env.CLOUDINARY_API_KEY!
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!

  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = `public_id=${public_id}&timestamp=${timestamp}`
  const signature = createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex")

  const form = new FormData()
  form.append("public_id", public_id)
  form.append("signature", signature)
  form.append("api_key", apiKey)
  form.append("timestamp", String(timestamp))

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: "POST", body: form }
  )

  const data = (await res.json()) as { result: string }

  // "not found" is acceptable — image may have been deleted already
  if (data.result !== "ok" && data.result !== "not found") {
    return NextResponse.json({ error: "Error al eliminar de Cloudinary" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
