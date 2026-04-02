import { EnrollmentPageClient } from "@/components/enrollment/enrollment-page-client";
import { AppShell } from "@/components/shell/app-shell";
import { getEnrollmentData } from "@/lib/api/portal";

export const dynamic = "force-dynamic";

export default async function InscricoesPage() {
  const data = await getEnrollmentData();

  return (
    <AppShell
      activeRoute="inscricoes"
      eyebrow="Inscrições"
      title="Inscrição em categorias"
      description="Escolha uma categoria com vagas disponíveis e conclua a inscrição do participante nesta mesma tela."
      sidebarEyebrow="Como se inscrever"
      sidebarTitle="Passo a passo"
      sidebarDescription="Selecione uma categoria na lista principal, confira as informações do evento e preencha os dados solicitados para concluir a inscrição."
    >
      <EnrollmentPageClient initialData={data} />
    </AppShell>
  );
}
