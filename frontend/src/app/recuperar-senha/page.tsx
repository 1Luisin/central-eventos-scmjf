import { PasswordRecoveryPageClient } from "@/components/login/password-recovery-page-client";

type PasswordRecoveryPageProps = {
  searchParams?: Promise<{
    accessMode?: string;
    identifier?: string;
    redirect?: string;
  }>;
};

export default async function PasswordRecoveryPage({ searchParams }: PasswordRecoveryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const initialAccessMode =
    resolvedSearchParams?.accessMode === "externo" || resolvedSearchParams?.accessMode === "interno"
      ? resolvedSearchParams.accessMode
      : "interno";

  return (
    <PasswordRecoveryPageClient
      initialAccessMode={initialAccessMode}
      initialIdentifier={resolvedSearchParams?.identifier ?? ""}
      initialRedirectPath={resolvedSearchParams?.redirect ?? ""}
    />
  );
}
