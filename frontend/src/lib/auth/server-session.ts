import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, type LoginSession } from "@/lib/auth/session";

const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";

export async function hasAuthenticatedSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export async function getAuthenticatedUserGreetingName(): Promise<string | null> {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!rawSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(decodeURIComponent(rawSession)) as LoginSession;
    const fullName = parsedSession.internalUser?.nomeUsuario ?? parsedSession.externalUser?.nomeCompleto ?? "";
    return formatGreetingName(fullName);
  } catch {
    return null;
  }
}

export function resolveAuthenticatedRoute(redirectPath?: string): string {
  if (!redirectPath || !redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  return redirectPath;
}

function formatGreetingName(fullName: string): string | null {
  const normalizedParts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (normalizedParts.length === 0) {
    return null;
  }

  return normalizedParts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
