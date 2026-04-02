import { NextRequest } from "next/server";

import { buildJsonHeaders, buildProxyErrorResponse, requestBackend, toProxyResponse } from "@/lib/api/backend";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = buildJsonHeaders();
    const forwardedFor = request.headers.get("x-forwarded-for");

    if (forwardedFor) {
      headers.set("X-Forwarded-For", forwardedFor);
    }

    const response = await requestBackend("/usuarios-externos/recuperacao-senha/redefinir", {
      method: "POST",
      body,
      headers
    });

    return toProxyResponse(response);
  } catch (error) {
    return buildProxyErrorResponse(error);
  }
}
