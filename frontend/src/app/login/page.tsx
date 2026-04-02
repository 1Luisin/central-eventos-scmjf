import { redirect } from "next/navigation";

import { LoginPageClient } from "@/components/login/login-page-client";
import { hasAuthenticatedSession, resolveAuthenticatedRoute } from "@/lib/auth/server-session";

type LoginPageProps = {
  searchParams?: Promise<{
    accessMode?: string;
    identifier?: string;
    passwordReset?: string;
    registered?: string;
    redirect?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (await hasAuthenticatedSession()) {
    redirect(resolveAuthenticatedRoute(resolvedSearchParams?.redirect));
  }

  const initialAccessMode =
    resolvedSearchParams?.accessMode === "externo" || resolvedSearchParams?.accessMode === "interno"
      ? resolvedSearchParams.accessMode
      : "interno";

  const initialFeedback =
    resolvedSearchParams?.passwordReset === "1"
      ? "Senha redefinida com sucesso. Entre com o seu e-mail e a nova senha."
      : resolvedSearchParams?.registered === "1"
        ? "Cadastro concluído com sucesso. Entre com o e-mail e a senha cadastrados."
        : "";

  return (
    <LoginPageClient
      initialAccessMode={initialAccessMode}
      initialFeedback={initialFeedback}
      initialFeedbackTone={initialFeedback ? "success" : "error"}
      initialIdentifier={resolvedSearchParams?.identifier ?? ""}
      initialRedirectPath={resolvedSearchParams?.redirect ?? ""}
    />
  );
}
