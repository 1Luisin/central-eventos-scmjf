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
      sidebarEyebrow="Consulta rápida"
      sidebarTitle="Orientações"
      sidebarDescription={
        <>
          <p>Use esta tela para localizar eventos, conferir vagas e orientar o participante para a categoria correta.</p>
          <ul className="sidebar-note__list">
            <li>Use a busca para localizar por evento, setor ou categoria.</li>
            <li>Confira datas, responsável e quantidade de vagas diretamente em cada card.</li>
            <li>Abra a inscrição ou, quando disponível, a área de gestão pelo atalho do evento.</li>
          </ul>
        </>
      }
    >
      <DashboardPageClient initialData={data} sessionContext={sessionContext} />
    </AppShell>
  );
}
