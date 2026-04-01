import { NextRequest } from "next/server";

import { buildProxyErrorResponse, buildSessionJsonHeaders, requestBackend, toProxyResponse } from "@/lib/api/backend";

type RouteContext = {
  params: Promise<{
    id: string;
  }> | {
    id: string;
  };
};

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await Promise.resolve(context.params);
    const body = await request.text();

    const response = await requestBackend(`/eventos/${id}`, {
      method: "PUT",
      body,
      headers: await buildSessionJsonHeaders({ requireInternalAdmin: true })
    });

    return toProxyResponse(response);
  } catch (error) {
    return buildProxyErrorResponse(error);
  }
}
