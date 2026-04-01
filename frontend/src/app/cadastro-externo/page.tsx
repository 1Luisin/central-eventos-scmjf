import { ExternalRegistrationPageClient } from "@/components/login/external-registration-page-client";

type CadastroExternoPageProps = {
  searchParams?: Promise<{
    redirect?: string;
  }>;
};

export default async function CadastroExternoPage({ searchParams }: CadastroExternoPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return <ExternalRegistrationPageClient initialRedirectPath={resolvedSearchParams?.redirect ?? ""} />;
}
