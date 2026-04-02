import { AdminAccessGate } from "@/components/access/admin-access-gate";
import { AdminPageClient } from "@/components/admin/admin-page-client";
import { AppShell } from "@/components/shell/app-shell";
import { getAdminData } from "@/lib/api/portal";

export const dynamic = "force-dynamic";

export default async function CadastrosPage() {
  const data = await getAdminData();

  return (
    <AppShell
      activeRoute="cadastros"
      eyebrow="Cadastros"
      title="Eventos e categorias"
      description="Cadastre novos eventos, atualize as informações dos eventos criados por você e inclua as categorias necessárias."
      sidebarEyebrow="Gestão"
      sidebarTitle="Eventos do responsável"
      sidebarDescription="Nesta área você acompanha apenas os eventos que criou, podendo atualizar dados, cadastrar categorias e acompanhar os participantes inscritos."
    >
      <AdminAccessGate>
        <AdminPageClient initialData={data} />
      </AdminAccessGate>
    </AppShell>
  );
}
