import { NextRequest, NextResponse } from "next/server";

import {
  createExternalLoginSession,
  persistAuthenticatedSession
} from "@/lib/auth/server-session";
import { buildJsonHeaders, buildProxyErrorResponse, requestBackend, toProxyResponse } from "@/lib/api/backend";
import type { AuthLoginResponse, ExternalUserResponse, MessageResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const response = await requestBackend("/usuarios-externos/login", {
      method: "POST",
      body,
      headers: buildJsonHeaders()
    });

    if (!response.ok) {
      return toProxyResponse(response);
    }

    const payload = (await response.json()) as AuthLoginResponse<ExternalUserResponse>;
    const nextResponse = NextResponse.json<MessageResponse>({ mensagem: "Login realizado com sucesso." });
    persistAuthenticatedSession(
      nextResponse,
      createExternalLoginSession(payload.usuario, payload.expiresInSeconds),
      payload.accessToken
    );

    return nextResponse;
  } catch (error) {
    return buildProxyErrorResponse(error);
  }
}
