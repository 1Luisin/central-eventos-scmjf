import { LoginPageClient } from "@/components/login/login-page-client";

type LoginPageProps = {
  searchParams?: Promise<{
    accessMode?: string;
    identifier?: string;
    registered?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialAccessMode =
    resolvedSearchParams?.accessMode === "externo" || resolvedSearchParams?.accessMode === "interno"
      ? resolvedSearchParams.accessMode
      : "interno";

  return (
    <LoginPageClient
      initialAccessMode={initialAccessMode}
      initialFeedback={
        resolvedSearchParams?.registered === "1"
          ? "Cadastro externo concluído. Agora faça seu acesso com o e-mail e a senha definidos."
          : ""
      }
      initialFeedbackTone={resolvedSearchParams?.registered === "1" ? "success" : "error"}
      initialIdentifier={resolvedSearchParams?.identifier ?? ""}
    />
  );
}
