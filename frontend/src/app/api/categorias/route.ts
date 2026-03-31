import { NextRequest } from "next/server";

import { buildJsonHeaders, buildProxyErrorResponse, requestBackend, toProxyResponse } from "@/lib/api/backend";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const userLog = request.headers.get("x-usuario-log");

    const response = await requestBackend("/categorias", {
      method: "POST",
      body,
      headers: buildJsonHeaders(userLog)
    });

    return toProxyResponse(response);
  } catch (error) {
    return buildProxyErrorResponse(error);
  }
}
