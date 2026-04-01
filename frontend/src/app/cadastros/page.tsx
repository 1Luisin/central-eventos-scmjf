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
      description="Registre os eventos da Santa Casa, selecione um evento existente e adicione quantas categorias forem necessárias."
      sidebarEyebrow="Área administrativa"
      sidebarTitle="Cadastros centrais"
      sidebarDescription="Gerencie eventos e adicione categorias. Depois do cadastro, todas as informações necessárias aparecerão nesta página."
    >
      <AdminAccessGate>
        <AdminPageClient initialData={data} />
      </AdminAccessGate>
    </AppShell>
  );
}
