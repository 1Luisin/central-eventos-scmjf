import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import type { ExternalUserResponse, InternalUserResponse } from "@/types/api";
import {
  AUTH_TOKEN_COOKIE_NAME,
  COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  type AccessMode,
  type LoginSession,
  type SessionUserContext
} from "@/lib/auth/session";

const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";

export type ServerSessionUserContext = SessionUserContext;

export async function hasAuthenticatedSession(): Promise<boolean> {
  return Boolean(await getServerAuthenticatedSession());
}

export async function getServerLoginSession(): Promise<LoginSession | null> {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawSession) {
    return null;
  }

  return parseSignedSession(rawSession);
}

export async function getServerBackendAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value ?? null;
}

export async function getServerSessionUserContext(): Promise<ServerSessionUserContext | null> {
  const session = await getServerAuthenticatedSession();

  if (!session) {
    return null;
  }

  return {
    accessMode: session.accessMode,
    identifier: session.identifier,
    displayName: session.displayName,
    isInternalAdmin: session.isInternalAdmin,
    externalUser: session.externalUser ?? null,
    internalUser: session.internalUser ?? null
  };
}

export async function getAuthenticatedUserGreetingName(): Promise<string | null> {
  const session = await getServerAuthenticatedSession();
  return formatGreetingName(session?.displayName ?? "");
}

export function resolveAuthenticatedRoute(redirectPath?: string): string {
  if (!redirectPath || !redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  return redirectPath;
}

export function createInternalLoginSession(
  user: InternalUserResponse,
  expiresInSeconds: number
): LoginSession {
  const now = new Date();
  return {
    accessMode: "interno",
    identifier: user.matricula,
    displayName: user.nomeUsuario,
    isInternalAdmin: user.tipoUsuario === "ADMINISTRADOR",
    loggedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + expiresInSeconds * 1000).toISOString(),
    internalUser: user
  };
}

export function createExternalLoginSession(
  user: ExternalUserResponse,
  expiresInSeconds: number
): LoginSession {
  const now = new Date();
  return {
    accessMode: "externo",
    identifier: user.email,
    displayName: user.nomeCompleto,
    isInternalAdmin: false,
    loggedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + expiresInSeconds * 1000).toISOString(),
    externalUser: user
  };
}

export function persistAuthenticatedSession(response: NextResponse, session: LoginSession, accessToken: string) {
  const maxAge = resolveSessionMaxAgeSeconds(session.expiresAt);

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: signSession(session),
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge
  });

  response.cookies.set({
    name: AUTH_TOKEN_COOKIE_NAME,
    value: accessToken,
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge
  });
}

export function clearAuthenticatedSession(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 0
  });

  response.cookies.set({
    name: AUTH_TOKEN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 0
  });
}

function parseSignedSession(rawValue: string): LoginSession | null {
  const [encodedPayload, signature] = rawValue.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  if (!safeEquals(expectedSignature, signature)) {
    return null;
  }

  try {
    const payload = decodeBase64Url(encodedPayload);
    const session = JSON.parse(payload) as LoginSession;
    return isSessionExpired(session.expiresAt) ? null : session;
  } catch {
    return null;
  }
}

async function getServerAuthenticatedSession(): Promise<LoginSession | null> {
  const [session, accessToken] = await Promise.all([
    getServerLoginSession(),
    getServerBackendAccessToken()
  ]);

  if (!session || !accessToken) {
    return null;
  }

  return session;
}

function signSession(session: LoginSession): string {
  const encodedPayload = encodeBase64Url(JSON.stringify(session));
  return `${encodedPayload}.${signValue(encodedPayload)}`;
}

function signValue(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function shouldUseSecureCookies(): boolean {
  return process.env.NODE_ENV === "production";
}

function isSessionExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) {
    return true;
  }

  const expiresAtMs = Date.parse(expiresAt);
  return Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now();
}

function resolveSessionMaxAgeSeconds(expiresAt: string): number {
  const expiresAtMs = Date.parse(expiresAt);

  if (Number.isNaN(expiresAtMs)) {
    return COOKIE_MAX_AGE_SECONDS;
  }

  const remainingSeconds = Math.ceil((expiresAtMs - Date.now()) / 1000);
  return Math.min(COOKIE_MAX_AGE_SECONDS, Math.max(1, remainingSeconds));
}

function getSessionSecret(): string {
  const configuredSecret = process.env.FRONTEND_SESSION_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "central-eventos-dev-session-secret";
  }

  throw new Error("FRONTEND_SESSION_SECRET deve estar configurado para autenticação segura no frontend.");
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
