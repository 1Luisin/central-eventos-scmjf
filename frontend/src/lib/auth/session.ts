import type { ExternalUserResponse } from "@/types/api";

export type AccessMode = "interno" | "externo";

export type LoginSession = {
  accessMode: AccessMode;
  identifier: string;
  loggedAt: string;
  externalUser?: ExternalUserResponse | null;
};

const STORAGE_KEY = "central-eventos-login";

export function saveLoginSession(session: LoginSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function readLoginSession(): LoginSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as LoginSession;
  } catch {
    return null;
  }
}

export function clearLoginSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(STORAGE_KEY);
}
