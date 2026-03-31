import { NextRequest } from "next/server";

import { buildJsonHeaders, buildProxyErrorResponse, requestBackend, toProxyResponse } from "@/lib/api/backend";

type RouteContext = {
  params: Promise<{
    id: string;
  }> | {
    id: string;
  };
};

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await Promise.resolve(context.params);
    const userLog = request.headers.get("x-usuario-log");

    const response = await requestBackend(`/inscricoes/${id}`, {
      method: "DELETE",
      headers: buildJsonHeaders(userLog)
    });

    return toProxyResponse(response);
  } catch (error) {
    return buildProxyErrorResponse(error);
  }
}
