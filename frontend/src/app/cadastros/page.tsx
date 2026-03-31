import { AppShell } from "@/components/shell/app-shell";
import { AdminPageClient } from "@/components/admin/admin-page-client";
import { getAdminData } from "@/lib/api/portal";

export const dynamic = "force-dynamic";

export default async function CadastrosPage() {
  const data = await getAdminData();

  return (
    <AppShell
      activeRoute="cadastros"
      eyebrow="Área administrativa"
      title="Cadastros de eventos e categorias"
      description="Cadastre novos eventos, adicione categorias vinculadas e acompanhe nesta mesma tela os participantes já inscritos."
      sidebarEyebrow="Gestão institucional"
      sidebarTitle="Cadastros centrais"
      sidebarDescription="Os formulários abaixo seguem os contratos e as regras de negócio da API Oracle, incluindo status ativo, vagas e auditoria."
    >
      <AdminPageClient initialData={data} />
    </AppShell>
  );
}
