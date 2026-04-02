import { NextRequest, NextResponse } from "next/server";

import {
  AUTH_TOKEN_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  type LoginSession
} from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const accessTokenCookie = request.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value;
  const hasValidSession =
    Boolean(sessionCookie) &&
    Boolean(accessTokenCookie) &&
    (await verifySignedSession(sessionCookie as string));

  if (hasValidSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const redirectTarget = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("redirect", redirectTarget);

  const response = NextResponse.redirect(loginUrl);

  if (sessionCookie || accessTokenCookie) {
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

  return response;
}

async function verifySignedSession(rawValue: string): Promise<boolean> {
  const [encodedPayload, signature] = rawValue.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = await signValue(encodedPayload);
  if (expectedSignature !== signature) {
    return false;
  }

  try {
    const payload = decodeBase64Url(encodedPayload);
    const session = JSON.parse(payload) as LoginSession;
    return !isSessionExpired(session.expiresAt);
  } catch {
    return false;
  }
}

async function signValue(value: string): Promise<string> {
  const keyBytes = new TextEncoder().encode(getSessionSecret());
  const importedKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    importedKey,
    new TextEncoder().encode(value)
  );

  return encodeBase64Url(signatureBuffer);
}

function encodeBase64Url(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const base64 = normalized + "=".repeat(paddingLength);
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
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

function isSessionExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) {
    return true;
  }

  const expiresAtMs = Date.parse(expiresAt);
  return Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now();
}

function shouldUseSecureCookies(): boolean {
  return process.env.NODE_ENV === "production";
}

export const config = {
  matcher: ["/dashboard/:path*", "/cadastros/:path*", "/inscricoes/:path*", "/minhas-inscricoes/:path*"]
};
