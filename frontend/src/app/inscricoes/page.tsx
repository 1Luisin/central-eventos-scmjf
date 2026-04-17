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
      description="Selecione um evento, consulte as categorias disponíveis e conclua a inscrição do participante em um pop-up rápido e objetivo."
      sessionContext={sessionContext}
      sidebarEyebrow="Como se inscrever"
      sidebarTitle="Passo a passo"
      sidebarDescription="Use o atalho Veja mais na lista principal, escolha a categoria desejada e confirme a inscrição pelo pop-up da própria página."
    >
      <EnrollmentPageClient initialData={data} sessionContext={sessionContext} />
    </AppShell>
  );
}
