import { PasswordRecoveryPageClient } from "@/components/login/password-recovery-page-client";

type PasswordRecoveryPageProps = {
  searchParams?: Promise<{
    identifier?: string;
    redirect?: string;
  }>;
};

export default async function PasswordRecoveryPage({ searchParams }: PasswordRecoveryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <PasswordRecoveryPageClient
      initialIdentifier={resolvedSearchParams?.identifier ?? ""}
      initialRedirectPath={resolvedSearchParams?.redirect ?? ""}
    />
  );
}
