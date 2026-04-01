import { AppShell } from "@/components/shell/app-shell";
import { EnrollmentPageClient } from "@/components/enrollment/enrollment-page-client";
import { getEnrollmentData } from "@/lib/api/portal";

export const dynamic = "force-dynamic";

export default async function InscricoesPage() {
  const data = await getEnrollmentData();

  return (
    <AppShell
      activeRoute="inscricoes"
      eyebrow="Inscrições"
      title="Tela de inscrição"
      description="Escolha uma categoria aberta, confira as vagas disponíveis e registre a sua inscrição."
      sidebarEyebrow="Portal do participante"
      sidebarTitle="Inscrições por categoria"
      sidebarDescription="Selecione uma categoria na lista principal, preencha os dados do participante e confirme a inscrição nesta mesma tela."
    >
      <EnrollmentPageClient initialData={data} />
    </AppShell>
  );
}
