import type { ExternalUserResponse, InternalUserResponse } from "@/types/api";

export type AccessMode = "interno" | "externo";

export type LoginSession = {
  accessMode: AccessMode;
  identifier: string;
  loggedAt: string;
  externalUser?: ExternalUserResponse | null;
  internalUser?: InternalUserResponse | null;
};

const STORAGE_KEY = "central-eventos-login";
export const AUTH_COOKIE_NAME = "central-eventos-auth";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

export function saveLoginSession(session: LoginSession) {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(session);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  window.sessionStorage.setItem(STORAGE_KEY, serialized);
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(serialized)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function readLoginSession(): LoginSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue =
    window.localStorage.getItem(STORAGE_KEY) ??
    window.sessionStorage.getItem(STORAGE_KEY) ??
    readCookieValue(AUTH_COOKIE_NAME);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as LoginSession;
    const serialized = JSON.stringify(parsed);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    window.sessionStorage.setItem(STORAGE_KEY, serialized);
    return parsed;
  } catch {
    return null;
  }
}

export function clearLoginSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function isAdminSession(session: LoginSession | null): boolean {
  return session?.accessMode === "interno" && session.internalUser?.tipoUsuario === "ADMINISTRADOR";
}

function readCookieValue(cookieName: string): string | null {
  const prefix = `${cookieName}=`;
  const match = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return null;
  }
}
