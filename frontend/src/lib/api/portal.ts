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
  MyEnrollmentCategoryItem,
  MyEnrollmentEventItem,
  MyEnrollmentsData,
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

function buildFallbackEvento(inscricao: InscricaoResponse): EventoResponse {
  return {
    id: inscricao.eventoId,
    nomeEvento: `Evento #${inscricao.eventoId}`,
    dataHoraInicio: "",
    dataHoraFim: "",
    nomeResponsavel: "Não informado",
    nomeSetor: inscricao.nomeSetor || "Não informado",
    numeroContato: inscricao.numeroContato || "Não informado",
    ativo: "N",
    descricao: null
  };
}

function buildFallbackCategoria(inscricao: InscricaoResponse): CategoriaResponse {
  return {
    id: inscricao.categoriaId,
    eventoId: inscricao.eventoId,
    nomeCategoria: `Categoria #${inscricao.categoriaId}`,
    externo: inscricao.tipoParticipante === "EXTERNO" ? "S" : "N",
    descricao: null,
    ativo: "N",
    limiteInscricoes: 0,
    dataHoraFimInscricao: null,
    inscricoesRealizadas: 0,
    vagasDisponiveis: 0
  };
}

function toMyEnrollmentEventItem(
  evento: EventoResponse,
  categoriasInscritas: MyEnrollmentCategoryItem[]
): MyEnrollmentEventItem {
  const dataUltimaInscricao = [...categoriasInscritas]
    .sort((left, right) => new Date(right.inscricao.dataHoraRegistro).getTime() - new Date(left.inscricao.dataHoraRegistro).getTime())[0]
    ?.inscricao.dataHoraRegistro ?? "";

  return {
    ...evento,
    categoriasInscritas,
    totalCategoriasInscritas: categoriasInscritas.length,
    dataUltimaInscricao
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

export async function getMyEnrollmentsData(): Promise<MyEnrollmentsData> {
  try {
    const headers = await buildSessionJsonHeaders();
    const minhasInscricoes = await listarMinhasInscricoes(headers);

    if (minhasInscricoes.length === 0) {
      return {
        eventos: [],
        atualizadoEm: new Date().toISOString()
      };
    }

    const eventos = await listarEventos(headers);
    const eventosPorId = new Map<number, EventoResponse>(eventos.map((evento) => [evento.id, evento]));
    const eventoIds = [...new Set(minhasInscricoes.map((inscricao) => inscricao.eventoId))];
    const categoriasPorEvento = new Map<number, CategoriaResponse[]>(
      await Promise.all(
        eventoIds.map(async (eventoId) => [eventoId, await listarCategorias(eventoId, headers)] as const)
      )
    );

    const agrupado = new Map<number, MyEnrollmentCategoryItem[]>();

    for (const inscricao of minhasInscricoes) {
      const evento = eventosPorId.get(inscricao.eventoId) ?? buildFallbackEvento(inscricao);
      const categoriaBase =
        categoriasPorEvento.get(inscricao.eventoId)?.find((categoria) => categoria.id === inscricao.categoriaId) ??
        buildFallbackCategoria(inscricao);

      const categoria = {
        ...decorateCategoria(evento, categoriaBase),
        usuarioJaInscrito: true,
        inscricaoAtual: inscricao,
        inscricao
      } satisfies MyEnrollmentCategoryItem;

      const categoriasExistentes = agrupado.get(evento.id) ?? [];
      categoriasExistentes.push(categoria);
      agrupado.set(evento.id, categoriasExistentes);
      eventosPorId.set(evento.id, evento);
    }

    const itens = [...agrupado.entries()]
      .map(([eventoId, categoriasInscritas]) =>
        toMyEnrollmentEventItem(
          eventosPorId.get(eventoId) ?? buildFallbackEvento(categoriasInscritas[0].inscricao),
          [...categoriasInscritas].sort(
            (left, right) =>
              new Date(right.inscricao.dataHoraRegistro).getTime() - new Date(left.inscricao.dataHoraRegistro).getTime()
          )
        )
      )
      .sort((left, right) => {
        const leftDate = new Date(left.dataHoraInicio || left.dataUltimaInscricao).getTime();
        const rightDate = new Date(right.dataHoraInicio || right.dataUltimaInscricao).getTime();
        return leftDate - rightDate;
      });

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
            : "Não foi possível carregar suas inscrições no momento."
    };
  }
}
