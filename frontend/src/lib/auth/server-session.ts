import { cookies } from "next/headers";

import type { AccessMode, LoginSession } from "@/lib/auth/session";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";

export type ServerSessionUserContext = {
  accessMode: AccessMode;
  identifier: string;
  displayName: string;
  isInternalAdmin: boolean;
};

export async function hasAuthenticatedSession(): Promise<boolean> {
  return Boolean(await getServerLoginSession());
}

export async function getServerLoginSession(): Promise<LoginSession | null> {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(rawSession)) as LoginSession;
  } catch {
    return null;
  }
}

export async function getServerSessionUserContext(): Promise<ServerSessionUserContext | null> {
  const session = await getServerLoginSession();

  if (!session) {
    return null;
  }

  if (session.accessMode === "interno" && session.internalUser) {
    return {
      accessMode: "interno",
      identifier: session.internalUser.matricula,
      displayName: session.internalUser.nomeUsuario,
      isInternalAdmin: session.internalUser.tipoUsuario === "ADMINISTRADOR"
    };
  }

  if (session.accessMode === "externo" && session.externalUser) {
    return {
      accessMode: "externo",
      identifier: session.externalUser.email,
      displayName: session.externalUser.nomeCompleto,
      isInternalAdmin: false
    };
  }

  return null;
}

export async function getAuthenticatedUserGreetingName(): Promise<string | null> {
  const session = await getServerLoginSession();
  const fullName = session?.internalUser?.nomeUsuario ?? session?.externalUser?.nomeCompleto ?? "";
  return formatGreetingName(fullName);
}

export function isAdminLoginSession(session: LoginSession | null): boolean {
  return session?.accessMode === "interno" && session.internalUser?.tipoUsuario === "ADMINISTRADOR";
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
