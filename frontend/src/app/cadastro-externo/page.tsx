import { redirect } from "next/navigation";

import { ExternalRegistrationPageClient } from "@/components/login/external-registration-page-client";
import { hasAuthenticatedSession, resolveAuthenticatedRoute } from "@/lib/auth/server-session";

type CadastroExternoPageProps = {
  searchParams?: Promise<{
    redirect?: string;
  }>;
};

export default async function CadastroExternoPage({ searchParams }: CadastroExternoPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (await hasAuthenticatedSession()) {
    redirect(resolveAuthenticatedRoute(resolvedSearchParams?.redirect));
  }

  return <ExternalRegistrationPageClient initialRedirectPath={resolvedSearchParams?.redirect ?? ""} />;
}
