import { AppShell } from "@/components/shell/app-shell";
import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client";
import { getDashboardData } from "@/lib/api/portal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <AppShell
      activeRoute="dashboard"
      eyebrow="Dashboard"
      title="Painel de eventos"
      description="Visualize os eventos da Santa Casa, acompanhe as categorias abertas e acesse rapidamente as telas de cadastro e inscrições."
      sidebarEyebrow="Painel principal"
      sidebarTitle="Eventos"
      sidebarDescription={
        <>
          <p>Consulte rapidamente os eventos vigentes, as categorias abertas e o status real de vagas antes de encaminhar um participante.</p>
          <ul className="sidebar-note__list">
            <li>Use a busca para localizar por evento, setor ou categoria.</li>
            <li>Confira datas, responsÃ¡vel e vagas diretamente no card.</li>
            <li>Abra inscriÃ§Ãµes ou gestÃ£o usando os atalhos de cada evento.</li>
          </ul>
        </>
      }
    >
      <DashboardPageClient initialData={data} />
    </AppShell>
  );
}
