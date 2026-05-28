import { redirect } from "next/navigation";

import { MyEnrollmentsPageClient } from "@/components/my-enrollments/my-enrollments-page-client";
import { AppShell } from "@/components/shell/app-shell";
import { getMyEnrollmentsData } from "@/lib/api/portal";
import { getServerSessionUserContext } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export default async function MinhasInscricoesPage() {
  const sessionContext = await getServerSessionUserContext();

  if (!sessionContext) {
    redirect("/login?redirect=%2Fminhas-inscricoes");
  }

  const data = await getMyEnrollmentsData();

  return (
    <AppShell
      activeRoute="minhas-inscricoes"
      eyebrow="Inscrições"
      title="Minhas inscrições"
      sessionContext={sessionContext}
      sidebarEyebrow="Acompanhamento"
      sidebarTitle="Consulta"
      sidebarDescription="Use a busca para localizar uma inscrição confirmada por evento, categoria ou contato."
    >
      <MyEnrollmentsPageClient initialData={data} />
    </AppShell>
  );
}
