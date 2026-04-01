import { NextRequest } from "next/server";

import { buildProxyErrorResponse, buildSessionJsonHeaders, requestBackend, toProxyResponse } from "@/lib/api/backend";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const response = await requestBackend("/categorias", {
      method: "POST",
      body,
      headers: await buildSessionJsonHeaders({ requireInternalAdmin: true })
    });

    return toProxyResponse(response);
  } catch (error) {
    return buildProxyErrorResponse(error);
  }
}
