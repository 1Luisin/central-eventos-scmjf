import { redirect } from "next/navigation";

import { EnrollmentPageClient } from "@/components/enrollment/enrollment-page-client";
import { AppShell } from "@/components/shell/app-shell";
import { getEnrollmentData } from "@/lib/api/portal";
import { getServerSessionUserContext } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export default async function InscricoesPage() {
  const sessionContext = await getServerSessionUserContext();

  if (!sessionContext) {
    redirect("/login?redirect=%2Finscricoes");
  }

  const data = await getEnrollmentData();

  return (
    <AppShell
      activeRoute="inscricoes"
      eyebrow="Inscrições"
      title="Inscrição em categorias"
      description="Escolha uma categoria com vagas disponíveis e conclua a inscrição do participante nesta mesma tela."
      sessionContext={sessionContext}
      sidebarEyebrow="Como se inscrever"
      sidebarTitle="Passo a passo"
      sidebarDescription="Selecione uma categoria na lista principal, confira as informações do evento e preencha os dados solicitados para concluir a inscrição."
    >
      <EnrollmentPageClient initialData={data} sessionContext={sessionContext} />
    </AppShell>
  );
}
