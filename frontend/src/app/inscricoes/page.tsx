import { AppShell } from "@/components/shell/app-shell";
import { EnrollmentPageClient } from "@/components/enrollment/enrollment-page-client";
import { getEnrollmentData } from "@/lib/api/portal";

export const dynamic = "force-dynamic";

export default async function InscricoesPage() {
  const data = await getEnrollmentData();

  return (
    <AppShell
      activeRoute="inscricoes"
      eyebrow="Portal do participante"
      title="Inscrições por categoria"
      description="Selecione uma categoria, confira as vagas reais retornadas pela API e conclua a inscrição com validação das regras de negócio."
      sidebarEyebrow="Fluxo de participação"
      sidebarTitle="Tela de inscrições"
      sidebarDescription="Categorias inativas, eventos inativos e turmas lotadas aparecem bloqueados automaticamente."
    >
      <EnrollmentPageClient initialData={data} />
    </AppShell>
  );
}
