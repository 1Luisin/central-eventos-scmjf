import { NextResponse } from "next/server";

import { getServerBackendAccessToken, getServerSessionUserContext } from "@/lib/auth/server-session";
import type { ApiErrorResponse } from "@/types/api";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export class BackendUnavailableError extends Error {
  constructor(message = "Não foi possível carregar as informações agora. Atualize a página ou tente novamente em instantes.") {
    super(message);
    this.name = "BackendUnavailableError";
  }
}

export class ProxyAuthorizationError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ProxyAuthorizationError";
    this.status = status;
  }
}

function getBackendBaseUrl(): string {
  return process.env.BACKEND_API_BASE_URL?.trim() || "http://127.0.0.1:8080";
}

function buildBackendUrl(path: string): string {
  const normalizedBase = getBackendBaseUrl().replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function requestBackend(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  try {
    return await fetch(buildBackendUrl(path), {
      ...init,
      headers,
      cache: "no-store"
    });
  } catch {
    throw new BackendUnavailableError();
  }
}

export async function fetchBackendJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await requestBackend(path, init);
  const payload = await readJson<T | ApiErrorResponse>(response);

  if (!response.ok) {
    const apiError = payload as ApiErrorResponse | null;
    throw new Error(apiError?.message || `Não foi possível concluir a solicitação agora (${response.status}).`);
  }

  return (payload ?? null) as T;
}

export async function toProxyResponse(response: Response): Promise<NextResponse> {
  const payload = await readJson<JsonValue>(response);

  if (payload !== null) {
    return NextResponse.json(payload, { status: response.status });
  }

  return new NextResponse(null, { status: response.status });
}

export function buildProxyErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Não foi possível concluir a solicitação no momento.";

  return NextResponse.json(
    {
      message,
      details: []
    },
    {
      status:
        error instanceof ProxyAuthorizationError
          ? error.status
          : error instanceof BackendUnavailableError
            ? 502
            : 500
    }
  );
}

export function buildJsonHeaders(): Headers {
  return new Headers({
    "Content-Type": "application/json",
    Accept: "application/json"
  });
}

export async function buildSessionJsonHeaders(options?: {
  requireAuthenticated?: boolean;
  requireInternalAdmin?: boolean;
}): Promise<Headers> {
  const { requireAuthenticated = true, requireInternalAdmin = false } = options ?? {};
  const sessionContext = await getServerSessionUserContext();

  if (!sessionContext) {
    if (requireAuthenticated) {
      throw new ProxyAuthorizationError("Sessão expirada. Faça login novamente para continuar.", 401);
    }

    return buildJsonHeaders();
  }

  if (requireInternalAdmin && !sessionContext.isInternalAdmin) {
    throw new ProxyAuthorizationError("Acesso restrito à área administrativa.", 403);
  }

  const accessToken = await getServerBackendAccessToken();
  if (!accessToken) {
    throw new ProxyAuthorizationError("Sessão expirada. Faça login novamente para continuar.", 401);
  }

  const headers = buildJsonHeaders();
  headers.set("Authorization", `Bearer ${accessToken}`);
  return headers;
}
