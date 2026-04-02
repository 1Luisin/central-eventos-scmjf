import "server-only";

import { buildSessionJsonHeaders, fetchBackendJson, ProxyAuthorizationError } from "@/lib/api/backend";
import { getServerSessionUserContext } from "@/lib/auth/server-session";
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

async function listarEventos(headers?: Headers): Promise<EventoResponse[]> {
  return fetchBackendJson<EventoResponse[]>("/eventos", {
    headers
  });
}

async function listarMeusEventos(): Promise<EventoResponse[]> {
  return fetchBackendJson<EventoResponse[]>("/eventos/meus", {
    headers: await buildSessionJsonHeaders({ requireInternalAdmin: true })
  });
}

async function listarCategorias(eventoId: number, headers?: Headers): Promise<CategoriaResponse[]> {
  return fetchBackendJson<CategoriaResponse[]>(`/categorias/evento/${eventoId}`, {
    headers
  });
}

async function listarInscricoes(eventoId: number): Promise<InscricaoResponse[]> {
  return fetchBackendJson<InscricaoResponse[]>(`/inscricoes/evento/${eventoId}`, {
    headers: await buildSessionJsonHeaders({ requireInternalAdmin: true })
  });
}

async function listarMinhasInscricoes(headers: Headers): Promise<InscricaoResponse[]> {
  return fetchBackendJson<InscricaoResponse[]>("/inscricoes/minhas", {
    headers
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

function filterVisibleCategorias(categorias: CategoriaResponse[], isExternalUser: boolean): CategoriaResponse[] {
  if (!isExternalUser) {
    return categorias;
  }

  return categorias.filter((categoria) => categoria.externo?.toUpperCase() === "S");
}

function toDashboardItem(
  evento: EventoResponse,
  categorias: CategoriaResponse[],
  isExternalUser: boolean,
  inscricoesPorCategoria: Map<number, InscricaoResponse>
): EventoDashboardItem | null {
  const categoriasVisiveis = filterVisibleCategorias(categorias, isExternalUser);

  if (categoriasVisiveis.length === 0) {
    return null;
  }

  const categoriasDecoradas = categoriasVisiveis.map((categoria) => {
    const inscricaoAtual = inscricoesPorCategoria.get(categoria.id) ?? null;
    return {
      ...decorateCategoria(evento, categoria),
      usuarioJaInscrito: inscricaoAtual !== null,
      inscricaoAtual
    };
  });
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
    const sessionContext = await getServerSessionUserContext();
    const isExternalUser = sessionContext?.accessMode === "externo";
    const headers = sessionContext ? await buildSessionJsonHeaders() : undefined;
    const [eventosRaw, minhasInscricoes] = await Promise.all([
      listarEventos(headers),
      headers ? listarMinhasInscricoes(headers) : Promise.resolve<InscricaoResponse[]>([])
    ]);
    const eventos = sortEventos(filterActiveEventos(eventosRaw));
    const inscricoesPorCategoria = new Map<number, InscricaoResponse>(
      minhasInscricoes.map((inscricao) => [inscricao.categoriaId, inscricao])
    );
    const itens = (
      await Promise.all(
        eventos.map(async (evento) =>
          toDashboardItem(
            evento,
            await listarCategorias(evento.id, headers),
            isExternalUser,
            inscricoesPorCategoria
          )
        )
      )
    ).filter((evento): evento is EventoDashboardItem => evento !== null);

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
    const headers = await buildSessionJsonHeaders({ requireInternalAdmin: true });
    const itens = await Promise.all(
      eventos.map(async (evento) => {
        const [categorias, inscricoes] = await Promise.all([
          listarCategorias(evento.id, headers),
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
