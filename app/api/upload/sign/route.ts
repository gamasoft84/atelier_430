import { createHash } from "crypto"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await request.json()
  const { folder, public_id, timestamp } = body as {
    folder: string
    public_id: string
    timestamp: number
  }

  if (!folder || !public_id || !timestamp) {
    return NextResponse.json({ error: "Parámetros faltantes" }, { status: 400 })
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET!
  const apiKey = process.env.CLOUDINARY_API_KEY!
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!

  // Cloudinary signature: SHA1(sorted_params + api_secret)
  const paramsToSign = `folder=${folder}&public_id=${public_id}&timestamp=${timestamp}`
  const signature = createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex")

  return NextResponse.json({ signature, api_key: apiKey, cloud_name: cloudName, timestamp })
}
