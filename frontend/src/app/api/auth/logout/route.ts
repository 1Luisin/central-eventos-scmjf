import { NextResponse } from "next/server";

import { clearAuthenticatedSession } from "@/lib/auth/server-session";
import type { MessageResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json<MessageResponse>({ mensagem: "Sessão encerrada com sucesso." });
  clearAuthenticatedSession(response);
  return response;
}
