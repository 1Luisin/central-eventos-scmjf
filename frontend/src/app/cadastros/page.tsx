import { redirect } from "next/navigation";

import { AdminAccessGate } from "@/components/access/admin-access-gate";
import { AdminPageClient } from "@/components/admin/admin-page-client";
import { AppShell } from "@/components/shell/app-shell";
import { getAdminData } from "@/lib/api/portal";
import { getServerSessionUserContext } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export default async function CadastrosPage() {
  const sessionContext = await getServerSessionUserContext();

  if (!sessionContext) {
    redirect("/login?redirect=%2Fcadastros");
  }

  const data = sessionContext.isInternalAdmin
    ? await getAdminData()
    : {
        eventos: [],
        atualizadoEm: new Date().toISOString()
      };

  return (
    <AppShell
      activeRoute="cadastros"
      eyebrow="Cadastros"
      title="Eventos e categorias"
      sessionContext={sessionContext}
      sidebarEyebrow="Gestão"
      sidebarTitle="Cadastro em etapas"
      sidebarDescription="Cadastre o evento, selecione-o e depois crie as categorias."
    >
      <AdminAccessGate isAllowed={sessionContext.isInternalAdmin}>
        <AdminPageClient initialData={data} sessionContext={sessionContext} />
      </AdminAccessGate>
    </AppShell>
  );
}
