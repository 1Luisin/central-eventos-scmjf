"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";

import { getRequestErrorMessage, requestJson } from "@/lib/api/client";
import { isAdminSession, readLoginSession, type LoginSession } from "@/lib/auth/session";
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
};

export function DashboardPageClient({ initialData }: DashboardPageClientProps) {
  const [data, setData] = useState(initialData);
  const [loginSession, setLoginSession] = useState<LoginSession | null>(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(initialData.erroInicial ?? null);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setLoginSession(readLoginSession());
  }, []);

  const canManageEvents = isAdminSession(loginSession);
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
            <h2>Eventos e Categorias</h2>
          </div>

          <div className="toolbar">
            <label className="search-field">
              <span className="search-field__label">Buscar no painel</span>
              <input
                type="search"
                placeholder="Procure por evento, setor ou categoria"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <button className="button button--secondary" type="button" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? "Atualizando..." : "Atualizar painel"}
            </button>
          </div>
        </div>

        <p className="section-copy">
          Cada card resume o evento, exibe as categorias relacionadas e oferece acesso rápido para inscrições e, quando
          liberado, para a gestão administrativa.
        </p>

        {feedback ? <div className="feedback feedback--warning">{feedback}</div> : null}

        <div className="section-meta">
          <span>{formatCountLabel(filteredEvents.length, "evento listado", "eventos listados")}</span>
          <span>Última atualização: {formatDateTime(data.atualizadoEm)}</span>
        </div>
      </section>

      {filteredEvents.length === 0 ? (
        <section className="panel empty-panel">
          <span className="empty-panel__badge">Nenhum resultado</span>
          <h3>Não encontramos eventos para o filtro informado.</h3>
          <p>Limpe a busca ou atualize o painel para consultar novamente a API.</p>
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

              <p className="event-card__description">
                {evento.descricao || "Evento sem descrição complementar cadastrada."}
              </p>

              <div className="summary-strip">
                <span>{formatCountLabel(evento.totalInscricoes, "inscrição registrada", "inscrições registradas")}</span>
                <span>
                  {formatCountLabel(evento.totalVagas, "vaga distribuída nas categorias", "vagas distribuídas nas categorias")}
                </span>
              </div>

              {evento.categorias.length === 0 ? (
                <div className="inline-empty">Nenhuma categoria cadastrada para este evento até o momento.</div>
              ) : (
                <div className="category-grid">
                  {evento.categorias.map((categoria) => (
                    <section className="category-card" key={categoria.id}>
                      <div className="category-card__top">
                        <div>
                          <h4>{categoria.nomeCategoria}</h4>
                          <p>{categoria.descricao || "Categoria sem descrição complementar."}</p>
                        </div>

                        <span className={categoria.permiteInscricao ? "badge badge--success" : "badge badge--danger"}>
                          {categoria.statusLabel}
                        </span>
                      </div>

                      <div className="badge-row">
                        <span className="badge badge--ghost">
                          {formatBooleanFlag(categoria.externo, "Inscrição externa permitida", "Somente público interno")}
                        </span>
                        <span className={categoria.ativo === "S" ? "badge badge--neutral" : "badge badge--danger"}>
                          {toTitleCaseFlag(categoria.ativo, "Categoria ativa", "Categoria inativa")}
                        </span>
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

                      <p className="category-card__footnote">{categoria.statusDescription}</p>

                      <div className="card-actions">
                        <Link
                          className="button button--primary"
                          href={`/inscricoes?categoriaId=${categoria.id}&eventoId=${evento.id}`}
                        >
                          {categoria.permiteInscricao ? "Ir para inscrição" : "Ver bloqueio"}
                        </Link>
                        {canManageEvents ? (
                          <Link className="button button--secondary" href={`/cadastros?eventoId=${evento.id}`}>
                            Abrir gestão
                          </Link>
                        ) : null}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
