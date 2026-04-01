import { NextResponse } from "next/server";

import type { ApiErrorResponse } from "@/types/api";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export class BackendUnavailableError extends Error {
  constructor(message = "Não foi possível carregar as informações agora. Atualize a página ou tente novamente em instantes.") {
    super(message);
    this.name = "BackendUnavailableError";
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
    throw new Error(apiError?.message || `Falha ao consumir a API (${response.status}).`);
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
  const message = error instanceof Error ? error.message : "Falha inesperada ao comunicar com a API.";

  return NextResponse.json(
    {
      message,
      details: []
    },
    {
      status: error instanceof BackendUnavailableError ? 502 : 500
    }
  );
}

export function buildJsonHeaders(userLog?: string | null): HeadersInit {
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json"
  });

  if (userLog?.trim()) {
    headers.set("X-Usuario-Log", userLog.trim());
  }

  return headers;
}
