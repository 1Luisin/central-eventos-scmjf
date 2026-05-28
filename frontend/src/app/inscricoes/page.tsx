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
      description=""
      sessionContext={sessionContext}
      sidebarEyebrow="Fluxo"
      sidebarTitle="Inscrição"
      sidebarDescription="Escolha uma categoria disponível e confirme os dados no pop-up."
    >
      <EnrollmentPageClient initialData={data} sessionContext={sessionContext} />
    </AppShell>
  );
}
