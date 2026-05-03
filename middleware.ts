import { type NextRequest } from "next/server"
import { PERMISSIONS_POLICY } from "@/lib/http/permissions-policy"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const res = await updateSession(request)
  res.headers.set("Permissions-Policy", PERMISSIONS_POLICY)
  return res
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
