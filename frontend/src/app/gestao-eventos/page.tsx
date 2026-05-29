import { redirect } from "next/navigation";

import { AdminAccessGate } from "@/components/access/admin-access-gate";
import { AdminPageClient } from "@/components/admin/admin-page-client";
import { AppShell } from "@/components/shell/app-shell";
import { getAdminData } from "@/lib/api/portal";
import { getServerSessionUserContext } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export default async function GestaoEventosPage() {
  const sessionContext = await getServerSessionUserContext();

  if (!sessionContext) {
    redirect("/login?redirect=%2Fgestao-eventos");
  }

  const data = sessionContext.isInternalAdmin
    ? await getAdminData()
    : {
        eventos: [],
        atualizadoEm: new Date().toISOString()
      };

  return (
    <AppShell
      activeRoute="gestao-eventos"
      eyebrow="Área administrativa"
      title="Gerenciar eventos"
      sessionContext={sessionContext}
      sidebarEyebrow="Gestão"
      sidebarTitle="Eventos cadastrados"
      sidebarDescription="Edite eventos e categorias já existentes."
    >
      <AdminAccessGate isAllowed={sessionContext.isInternalAdmin}>
        <AdminPageClient initialData={data} sessionContext={sessionContext} mode="gestao" />
      </AdminAccessGate>
    </AppShell>
  );
}
