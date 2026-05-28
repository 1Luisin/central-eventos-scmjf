import { buildProxyErrorResponse, buildSessionJsonHeaders, requestBackend, toProxyResponse } from "@/lib/api/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await requestBackend("/setores", {
      headers: await buildSessionJsonHeaders()
    });

    return toProxyResponse(response);
  } catch (error) {
    return buildProxyErrorResponse(error);
  }
}
