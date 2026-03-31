import type { CategoriaResponse, CategoriaStatus, CategoriaViewModel, EventoResponse } from "@/types/api";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short"
});

export function formatDateTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateTimeFormatter.format(parsed);
}

export function formatBooleanFlag(flag: string, positive: string, negative: string): string {
  return flag?.toUpperCase() === "S" ? positive : negative;
}

export function toApiDateTime(value: string): string {
  if (!value) {
    return value;
  }

  return value.length === 16 ? `${value}:00` : value;
}

export function trimOrUndefined(value: FormDataEntryValue | null): string | undefined {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : undefined;
}

export function normalizeText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

export function getCategoryStatus(eventoAtivo: string, categoriaAtiva: string, vagasDisponiveis: number): {
  status: CategoriaStatus;
  statusLabel: string;
  statusDescription: string;
  permiteInscricao: boolean;
} {
  if (eventoAtivo?.toUpperCase() !== "S") {
    return {
      status: "evento-inativo",
      statusLabel: "Evento inativo",
      statusDescription: "As inscrições estão bloqueadas porque o evento está inativo.",
      permiteInscricao: false
    };
  }

  if (categoriaAtiva?.toUpperCase() !== "S") {
    return {
      status: "categoria-inativa",
      statusLabel: "Categoria inativa",
      statusDescription: "As inscrições estão bloqueadas porque a categoria está inativa.",
      permiteInscricao: false
    };
  }

  if (vagasDisponiveis <= 0) {
    return {
      status: "lotada",
      statusLabel: "Categoria lotada",
      statusDescription: "Não há vagas disponíveis para novas inscrições.",
      permiteInscricao: false
    };
  }

  return {
    status: "disponivel",
    statusLabel: "Inscrições abertas",
    statusDescription: "A categoria está ativa e ainda possui vagas disponíveis.",
    permiteInscricao: true
  };
}

export function decorateCategoria(evento: EventoResponse, categoria: CategoriaResponse): CategoriaViewModel {
  const { status, statusLabel, statusDescription, permiteInscricao } = getCategoryStatus(
    evento.ativo,
    categoria.ativo,
    categoria.vagasDisponiveis
  );

  const ocupacaoPercentual = categoria.limiteInscricoes > 0
    ? Math.min(Math.round((categoria.inscricoesRealizadas / categoria.limiteInscricoes) * 100), 100)
    : 0;

  return {
    ...categoria,
    eventoNome: evento.nomeEvento,
    eventoAtivo: evento.ativo,
    eventoInicio: evento.dataHoraInicio,
    eventoFim: evento.dataHoraFim,
    status,
    statusLabel,
    statusDescription,
    permiteInscricao,
    ocupacaoPercentual
  };
}

export function toTitleCaseFlag(flag: string | undefined, activeLabel: string, inactiveLabel: string): string {
  return flag?.toUpperCase() === "S" ? activeLabel : inactiveLabel;
}
