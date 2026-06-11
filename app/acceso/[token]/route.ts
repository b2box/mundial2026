import { NextResponse } from "next/server";
import { loginWithToken } from "@/lib/auth";
import { ensureSeeded } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  await ensureSeeded();
  const { token } = await params;
  const user = await loginWithToken(token);

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=1", request.url));
  }
  return NextResponse.redirect(new URL("/", request.url));
}
