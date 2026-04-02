import { PasswordResetPageClient } from "@/components/login/password-reset-page-client";

type PasswordResetPageProps = {
  searchParams?: Promise<{
    token?: string;
    redirect?: string;
  }>;
};

export default async function PasswordResetPage({ searchParams }: PasswordResetPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <PasswordResetPageClient
      initialRedirectPath={resolvedSearchParams?.redirect ?? ""}
      initialToken={resolvedSearchParams?.token ?? ""}
    />
  );
}
