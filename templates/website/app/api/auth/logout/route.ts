import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

async function clearAndRedirect(req: NextRequest) {
  const jar = await cookies();
  jar.delete(AUTH_COOKIE);
  return NextResponse.redirect(new URL("/login", req.url), 303);
}

export const GET = clearAndRedirect;
export const POST = clearAndRedirect;
