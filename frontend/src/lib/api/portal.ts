import "server-only";

import { buildSessionJsonHeaders, fetchBackendJson, ProxyAuthorizationError } from "@/lib/api/backend";
import { decorateCategoria } from "@/lib/formatters";
import type {
  AdminData,
  CategoriaAdminItem,
  CategoriaResponse,
  DashboardData,
  EnrollmentData,
  EventoAdminItem,
  EventoDashboardItem,
  EventoResponse,
  InscricaoResponse
} from "@/types/api";

async function listarEventos(): Promise<EventoResponse[]> {
  return fetchBackendJson<EventoResponse[]>("/eventos");
}

async function listarMeusEventos(): Promise<EventoResponse[]> {
  return fetchBackendJson<EventoResponse[]>("/eventos/meus", {
    headers: await buildSessionJsonHeaders({ requireInternalAdmin: true })
  });
}

async function listarCategorias(eventoId: number): Promise<CategoriaResponse[]> {
  return fetchBackendJson<CategoriaResponse[]>(`/categorias/evento/${eventoId}`);
}

async function listarInscricoes(eventoId: number): Promise<InscricaoResponse[]> {
  return fetchBackendJson<InscricaoResponse[]>(`/inscricoes/evento/${eventoId}`, {
    headers: await buildSessionJsonHeaders({ requireInternalAdmin: true })
  });
}

function sortEventos<T extends EventoResponse>(eventos: T[]): T[] {
  return [...eventos].sort((left, right) => {
    const leftDate = new Date(left.dataHoraInicio).getTime();
    const rightDate = new Date(right.dataHoraInicio).getTime();
    return leftDate - rightDate;
  });
}

function filterActiveEventos<T extends EventoResponse>(eventos: T[]): T[] {
  return eventos.filter((evento) => evento.ativo === "S");
}

function toDashboardItem(evento: EventoResponse, categorias: CategoriaResponse[]): EventoDashboardItem {
  const categoriasDecoradas = categorias.map((categoria) => decorateCategoria(evento, categoria));
  const totalVagas = categoriasDecoradas.reduce((accumulator, categoria) => accumulator + categoria.limiteInscricoes, 0);
  const totalInscricoes = categoriasDecoradas.reduce(
    (accumulator, categoria) => accumulator + categoria.inscricoesRealizadas,
    0
  );

  return {
    ...evento,
    categorias: categoriasDecoradas,
    totalCategorias: categoriasDecoradas.length,
    totalVagas,
    totalInscricoes,
    temInscricoesAbertas: categoriasDecoradas.some((categoria) => categoria.permiteInscricao)
  };
}

function toAdminItem(
  evento: EventoResponse,
  categorias: CategoriaResponse[],
  inscricoes: InscricaoResponse[]
): EventoAdminItem {
  const categoriasDecoradas: CategoriaAdminItem[] = categorias.map((categoria) => ({
    ...decorateCategoria(evento, categoria),
    inscricoes: inscricoes.filter((inscricao) => inscricao.categoriaId === categoria.id)
  }));

  const totalVagas = categoriasDecoradas.reduce((accumulator, categoria) => accumulator + categoria.limiteInscricoes, 0);
  const totalInscricoes = categoriasDecoradas.reduce(
    (accumulator, categoria) => accumulator + categoria.inscricoesRealizadas,
    0
  );

  return {
    ...evento,
    categorias: categoriasDecoradas,
    totalCategorias: categoriasDecoradas.length,
    totalVagas,
    totalInscricoes
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const eventos = sortEventos(filterActiveEventos(await listarEventos()));
    const itens = await Promise.all(
      eventos.map(async (evento) => toDashboardItem(evento, await listarCategorias(evento.id)))
    );

    return {
      eventos: itens,
      atualizadoEm: new Date().toISOString()
    };
  } catch (error) {
    return {
      eventos: [],
      atualizadoEm: new Date().toISOString(),
      erroInicial: error instanceof Error ? error.message : "Não foi possível carregar o painel."
    };
  }
}

export async function getAdminData(): Promise<AdminData> {
  try {
    const eventos = sortEventos(await listarMeusEventos());
    const itens = await Promise.all(
      eventos.map(async (evento) => {
        const [categorias, inscricoes] = await Promise.all([
          listarCategorias(evento.id),
          listarInscricoes(evento.id)
        ]);

        return toAdminItem(evento, categorias, inscricoes);
      })
    );

    return {
      eventos: itens,
      atualizadoEm: new Date().toISOString()
    };
  } catch (error) {
    return {
      eventos: [],
      atualizadoEm: new Date().toISOString(),
      erroInicial:
        error instanceof ProxyAuthorizationError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Não foi possível carregar a área administrativa."
    };
  }
}

export async function getEnrollmentData(): Promise<EnrollmentData> {
  const dashboard = await getDashboardData();

  return {
    eventos: dashboard.eventos,
    categorias: dashboard.eventos.flatMap((evento) => evento.categorias),
    atualizadoEm: dashboard.atualizadoEm,
    erroInicial: dashboard.erroInicial
  };
}
