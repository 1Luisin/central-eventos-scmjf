"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";

import { getRequestErrorMessage, requestJson } from "@/lib/api/client";
import type { SessionUserContext } from "@/lib/auth/session";
import {
  formatBooleanFlag,
  formatCountLabel,
  formatDateTime,
  formatFractionLabel,
  toTitleCaseFlag
} from "@/lib/formatters";
import type { DashboardData } from "@/types/api";

type DashboardPageClientProps = {
  initialData: DashboardData;
  sessionContext: SessionUserContext;
};

export function DashboardPageClient({ initialData, sessionContext }: DashboardPageClientProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(initialData.erroInicial ?? null);
  const deferredSearch = useDeferredValue(search);

  const canManageEvents = sessionContext.isInternalAdmin;
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredEvents = data.eventos.filter((evento) => {
    if (!normalizedSearch) {
      return true;
    }

    const haystack = [
      evento.nomeEvento,
      evento.nomeResponsavel,
      evento.nomeSetor,
      evento.descricao ?? "",
      ...evento.categorias.flatMap((categoria) => [
        categoria.nomeCategoria,
        categoria.descricao ?? "",
        categoria.statusLabel
      ])
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  async function handleRefresh() {
    try {
      setRefreshing(true);
      const payload = await requestJson<DashboardData>("/api/portal/dashboard");
      setData(payload);
      setFeedback(payload.erroInicial ?? null);
    } catch (error) {
      setFeedback(getRequestErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="stack-xl">
      <section className="panel">
        <div className="section-heading section-heading--compact">
          <div>
            <span className="eyebrow">Eventos cadastrados</span>
            <h2>Eventos e categorias</h2>
          </div>

          <div className="toolbar">
            <label className="search-field">
              <span className="search-field__label">Buscar eventos</span>
              <input
                type="search"
                placeholder="Procure por evento, setor ou categoria"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <button className="button button--secondary" type="button" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? "Atualizando..." : "Atualizar lista"}
            </button>
          </div>
        </div>

        <p className="section-copy">
          Cada card apresenta as principais informações do evento, as categorias disponíveis e os atalhos para inscrição ou gestão.
        </p>

        {feedback ? <div className="feedback feedback--warning">{feedback}</div> : null}

        <div className="section-meta">
          <span>{formatCountLabel(filteredEvents.length, "evento encontrado", "eventos encontrados")}</span>
          <span>Última atualização: {formatDateTime(data.atualizadoEm)}</span>
        </div>
      </section>

      {filteredEvents.length === 0 ? (
        <section className="panel empty-panel">
          <span className="empty-panel__badge">Nenhum resultado</span>
          <h3>Nenhum evento foi encontrado com esse filtro.</h3>
          <p>Altere o termo pesquisado ou atualize a lista para tentar novamente.</p>
        </section>
      ) : (
        <section className="event-grid">
          {filteredEvents.map((evento) => (
            <article className="event-card" key={evento.id}>
              <div className="event-card__header">
                <div>
                  <span className="eyebrow">Evento #{evento.id}</span>
                  <h3 className="event-title">{evento.nomeEvento}</h3>
                </div>

                <div className="badge-row">
                  <span className={evento.ativo === "S" ? "badge badge--success" : "badge badge--danger"}>
                    {toTitleCaseFlag(evento.ativo, "Evento ativo", "Evento inativo")}
                  </span>
                  <span className="badge badge--ghost">
                    {formatCountLabel(evento.totalCategorias, "categoria", "categorias")}
                  </span>
                </div>
              </div>

              <div className="meta-grid">
                <div className="meta-pill">
                  <span>Responsável</span>
                  <strong>{evento.nomeResponsavel}</strong>
                </div>
                <div className="meta-pill">
                  <span>Setor</span>
                  <strong>{evento.nomeSetor}</strong>
                </div>
                <div className="meta-pill">
                  <span>Contato</span>
                  <strong>{evento.numeroContato}</strong>
                </div>
                <div className="meta-pill">
                  <span>Período</span>
                  <strong>
                    {formatDateTime(evento.dataHoraInicio)} até {formatDateTime(evento.dataHoraFim)}
                  </strong>
                </div>
              </div>

              <p className="event-card__description">{evento.descricao || "Evento sem descrição complementar."}</p>

              <div className="summary-strip">
                <span>{formatCountLabel(evento.totalInscricoes, "inscrição registrada", "inscrições registradas")}</span>
                <span>{formatCountLabel(evento.totalVagas, "vaga disponível nas categorias", "vagas disponíveis nas categorias")}</span>
              </div>

              {evento.categorias.length === 0 ? (
                <div className="inline-empty">Nenhuma categoria foi cadastrada para este evento até o momento.</div>
              ) : (
                <div className="category-grid">
                  {evento.categorias.map((categoria) => {
                    const badgeClass = categoria.usuarioJaInscrito
                      ? "badge badge--success"
                      : categoria.permiteInscricao
                        ? "badge badge--success"
                        : "badge badge--danger";

                    return (
                      <section className="category-card" key={categoria.id}>
                        <div className="category-card__top">
                          <div>
                            <h4>{categoria.nomeCategoria}</h4>
                            <p>{categoria.descricao || "Categoria sem descrição complementar."}</p>
                          </div>

                          <span className={badgeClass}>
                            {categoria.usuarioJaInscrito ? "Inscrição confirmada" : categoria.statusLabel}
                          </span>
                        </div>

                        <div className="badge-row">
                          <span className="badge badge--ghost">
                            {formatBooleanFlag(categoria.externo, "Permite público externo", "Exclusiva para público interno")}
                          </span>
                          <span className={categoria.ativo === "S" ? "badge badge--neutral" : "badge badge--danger"}>
                            {toTitleCaseFlag(categoria.ativo, "Categoria ativa", "Categoria inativa")}
                          </span>
                          {categoria.usuarioJaInscrito ? (
                            <span className="badge badge--success">Você já está inscrito</span>
                          ) : null}
                        </div>

                        <div className="occupancy">
                          <div className="occupancy__track">
                            <div className="occupancy__value" style={{ width: `${categoria.ocupacaoPercentual}%` }} />
                          </div>
                          <div className="occupancy__legend">
                            <span>
                              {formatFractionLabel(
                                categoria.inscricoesRealizadas,
                                categoria.limiteInscricoes,
                                "inscrição",
                                "inscrições"
                              )}
                            </span>
                            <strong>{formatCountLabel(categoria.vagasDisponiveis, "vaga restante", "vagas restantes")}</strong>
                          </div>
                        </div>

                        <p className="category-card__footnote">
                          {categoria.usuarioJaInscrito
                            ? "Sua vaga nesta categoria já está confirmada. Não é necessário realizar uma nova inscrição."
                            : categoria.statusDescription}
                        </p>

                        <div className="card-actions">
                          {categoria.usuarioJaInscrito ? (
                            <span className="button button--secondary button--static">Inscrição confirmada</span>
                          ) : (
                            <Link
                              className="button button--primary"
                              href={`/inscricoes?categoriaId=${categoria.id}&eventoId=${evento.id}`}
                            >
                              {categoria.permiteInscricao ? "Realizar inscrição" : "Ver detalhes"}
                            </Link>
                          )}
                          {canManageEvents ? (
                            <Link className="button button--secondary" href={`/cadastros?eventoId=${evento.id}`}>
                              Abrir gestão
                            </Link>
                          ) : null}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
