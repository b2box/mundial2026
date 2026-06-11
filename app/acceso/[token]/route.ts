import { NextResponse } from "next/server";
import { loginWithToken } from "@/lib/auth";
import { ensureSeeded } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    await ensureSeeded();
    const user = await loginWithToken(token);
    if (!user) {
      return NextResponse.redirect(new URL("/login?error=1", request.url));
    }
    return NextResponse.redirect(new URL("/?bienvenida=1", request.url));
  } catch {
    // Base de datos no configurada o caída: mensaje claro en vez de un 500.
    return NextResponse.redirect(new URL("/login?error=config", request.url));
  }
}
