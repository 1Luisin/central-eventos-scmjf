import { NextResponse } from "next/server";

import { getAdminData } from "@/lib/api/portal";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getAdminData());
}
