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
      sidebarDescription=""
    >
      <DashboardPageClient initialData={data} />
    </AppShell>
  );
}
