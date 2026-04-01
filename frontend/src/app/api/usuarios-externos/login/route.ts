import { NextRequest } from "next/server";

import { buildJsonHeaders, buildProxyErrorResponse, requestBackend, toProxyResponse } from "@/lib/api/backend";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const response = await requestBackend("/usuarios-externos/login", {
      method: "POST",
      body,
      headers: buildJsonHeaders()
    });

    return toProxyResponse(response);
  } catch (error) {
    return buildProxyErrorResponse(error);
  }
}
