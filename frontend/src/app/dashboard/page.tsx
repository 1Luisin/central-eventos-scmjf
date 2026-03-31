import { AppShell } from "@/components/shell/app-shell";
import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client";
import { getDashboardData } from "@/lib/api/portal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <AppShell
      activeRoute="dashboard"
      eyebrow="Painel principal"
      title="Eventos da Santa Casa"
      description="Visualize os eventos da agenda institucional, acompanhe as categorias abertas e encaminhe o participante para a inscrição correta."
      sidebarEyebrow="Hospital Santa Casa de Misericórdia"
      sidebarTitle="Central de Eventos"
      sidebarDescription="Acompanhe o calendário oficial do hospital, com categorias e vagas atualizadas diretamente pela API."
    >
      <DashboardPageClient initialData={data} />
    </AppShell>
  );
}
