import { redirect } from "next/navigation";

import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client";
import { AppShell } from "@/components/shell/app-shell";
import { getDashboardData } from "@/lib/api/portal";
import { getServerSessionUserContext } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sessionContext = await getServerSessionUserContext();

  if (!sessionContext) {
    redirect("/login?redirect=%2Fdashboard");
  }

  const data = await getDashboardData();

  return (
    <AppShell
      activeRoute="dashboard"
      eyebrow="Eventos"
      title="Agenda de eventos"
      description=""
      sessionContext={sessionContext}
      sidebarEyebrow="Caminho rápido"
      sidebarTitle="Eventos e inscrições"
      sidebarDescription={
        <>
          <p>Localize o evento, confira as vagas e abra as categorias para iniciar uma inscrição.</p>
          <ul className="sidebar-note__list">
            <li>Use a busca para localizar por evento, setor ou categoria.</li>
            <li>O botão principal abre as categorias do evento.</li>
            <li>Administradores podem ir direto para a gestão.</li>
          </ul>
        </>
      }
    >
      <DashboardPageClient initialData={data} sessionContext={sessionContext} />
    </AppShell>
  );
}
