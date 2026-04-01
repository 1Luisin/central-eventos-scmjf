import { redirect } from "next/navigation";

import { hasAuthenticatedSession } from "@/lib/auth/server-session";

export default async function HomePage() {
  redirect((await hasAuthenticatedSession()) ? "/dashboard" : "/login");
}
