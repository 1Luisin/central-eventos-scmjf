import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const redirectTarget = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("redirect", redirectTarget);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/cadastros/:path*", "/inscricoes/:path*"]
};
