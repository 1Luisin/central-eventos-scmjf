import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";

export async function hasAuthenticatedSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export function resolveAuthenticatedRoute(redirectPath?: string): string {
  if (!redirectPath || !redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  return redirectPath;
}
