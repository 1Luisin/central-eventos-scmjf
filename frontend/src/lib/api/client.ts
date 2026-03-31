import type { ApiErrorResponse } from "@/types/api";

export class FrontendApiError extends Error {
  status: number;
  details: string[];

  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.name = "FrontendApiError";
    this.status = status;
    this.details = details;
  }
}

export async function requestJson<T>(input: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });

  const payload = await response
    .json()
    .catch(() => null as ApiErrorResponse | T | null);

  if (!response.ok) {
    const apiError = payload as ApiErrorResponse | null;
    throw new FrontendApiError(
      apiError?.message || `Falha na requisição (${response.status}).`,
      response.status,
      apiError?.details || []
    );
  }

  return payload as T;
}

export async function requestVoid(input: string, init: RequestInit = {}): Promise<void> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => null as ApiErrorResponse | null);

    throw new FrontendApiError(
      payload?.message || `Falha na requisição (${response.status}).`,
      response.status,
      payload?.details || []
    );
  }
}

export function getRequestErrorMessage(error: unknown): string {
  if (error instanceof FrontendApiError) {
    return error.details.length > 0 ? `${error.message} ${error.details.join(" ")}` : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível concluir a operação.";
}
