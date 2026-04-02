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
      eyebrow="Minhas inscrições"
      title="Acompanhamento das suas inscrições"
      description="Veja em quais eventos e categorias sua participação já foi confirmada e acompanhe os dados registrados."
      sessionContext={sessionContext}
      sidebarEyebrow="Acompanhamento"
      sidebarTitle="Como consultar"
      sidebarDescription={
        <>
          <p>Use esta área para revisar suas inscrições já confirmadas na Central de Eventos.</p>
          <ul className="sidebar-note__list">
            <li>Localize rapidamente por evento, categoria ou contato informado.</li>
            <li>Confira a data do registro e o status atual do evento e da categoria.</li>
            <li>Abra a inscrição sempre que quiser revisar os detalhes completos.</li>
          </ul>
        </>
      }
    >
      <MyEnrollmentsPageClient initialData={data} />
    </AppShell>
  );
}
