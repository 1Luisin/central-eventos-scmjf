"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";

import { getRequestErrorMessage, requestJson } from "@/lib/api/client";
import {
  formatBooleanFlag,
  formatCountLabel,
  formatDateTime,
  formatFractionLabel,
  toTitleCaseFlag
} from "@/lib/formatters";
import type { MyEnrollmentsData } from "@/types/api";

type MyEnrollmentsPageClientProps = {
  initialData: MyEnrollmentsData;
};

export function MyEnrollmentsPageClient({ initialData }: MyEnrollmentsPageClientProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(initialData.erroInicial ?? null);
  const deferredSearch = useDeferredValue(search);

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredEvents = data.eventos.filter((evento) => {
    if (!normalizedSearch) {
      return true;
    }

    const haystack = [
      evento.nomeEvento,
      evento.nomeSetor,
      evento.nomeResponsavel,
      evento.descricao ?? "",
      ...evento.categoriasInscritas.flatMap((categoria) => [
        categoria.nomeCategoria,
        categoria.descricao ?? "",
        categoria.inscricao.nomeUsuario,
        categoria.inscricao.matricula,
        categoria.inscricao.nomeSetor,
        categoria.inscricao.numeroContato
      ])
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  async function handleRefresh() {
    try {
      setRefreshing(true);
      const payload = await requestJson<MyEnrollmentsData>("/api/portal/minhas-inscricoes");
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
            <span className="eyebrow">Acompanhamento</span>
            <h2>Inscrições confirmadas</h2>
          </div>

          <div className="toolbar">
            <label className="search-field">
              <span className="search-field__label">Buscar inscrições</span>
              <input
                type="search"
                placeholder="Procure por evento, categoria ou contato"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <button className="button button--secondary" type="button" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? "Atualizando..." : "Atualizar lista"}
            </button>
          </div>
        </div>

        {feedback ? <div className="feedback feedback--warning">{feedback}</div> : null}

        <div className="section-meta">
          <span>{formatCountLabel(filteredEvents.length, "evento inscrito", "eventos inscritos")}</span>
          <span>Última atualização: {formatDateTime(data.atualizadoEm)}</span>
        </div>
      </section>

      {filteredEvents.length === 0 ? (
        <section className="panel empty-panel">
          <span className="empty-panel__badge">Nenhuma inscrição encontrada</span>
          <h3>Você ainda não possui inscrições registradas.</h3>
          <p>Quando uma inscrição for concluída, ela aparecerá aqui para acompanhamento.</p>
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
                    {formatCountLabel(evento.totalCategoriasInscritas, "categoria inscrita", "categorias inscritas")}
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

              {evento.descricao ? <p className="event-card__description">{evento.descricao}</p> : null}

              <div className="summary-strip">
                <span>{formatCountLabel(evento.totalCategoriasInscritas, "inscrição confirmada", "inscrições confirmadas")}</span>
                <span>Último registro: {formatDateTime(evento.dataUltimaInscricao)}</span>
              </div>

              <div className="category-grid">
                {evento.categoriasInscritas.map((categoria) => (
                  <section className="category-card" key={categoria.id}>
                    <div className="category-card__top">
                      <div>
                        <h4>{categoria.nomeCategoria}</h4>
                        {categoria.descricao ? <p>{categoria.descricao}</p> : null}
                      </div>

                      <span className="badge badge--success">Inscrição confirmada</span>
                    </div>

                    <div className="badge-row">
                      <span className="badge badge--ghost">
                        {formatBooleanFlag(categoria.externo, "Permite público externo", "Exclusiva para público interno")}
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

                    <div className="confirmation-card__grid">
                      <div className="confirmation-card__item">
                        <span>Participante</span>
                        <strong>{categoria.inscricao.nomeUsuario}</strong>
                      </div>
                      <div className="confirmation-card__item">
                        <span>{categoria.inscricao.tipoParticipante === "EXTERNO" ? "CPF" : "Matrícula"}</span>
                        <strong>{categoria.inscricao.matricula}</strong>
                      </div>
                      <div className="confirmation-card__item">
                        <span>{categoria.inscricao.tipoParticipante === "EXTERNO" ? "Usuário" : "Setor"}</span>
                        <strong>
                          {categoria.inscricao.tipoParticipante === "EXTERNO"
                            ? "Usuário externo"
                            : categoria.inscricao.nomeSetor}
                        </strong>
                      </div>
                      <div className="confirmation-card__item">
                        <span>Contato</span>
                        <strong>{categoria.inscricao.numeroContato}</strong>
                      </div>
                    </div>

                    <p className="category-card__footnote">
                      Registro realizado em {formatDateTime(categoria.inscricao.dataHoraRegistro)}. {categoria.statusDescription}
                    </p>

                    <div className="card-actions">
                      <Link
                        className="button button--secondary"
                        href={`/inscricoes?categoriaId=${categoria.id}&eventoId=${evento.id}`}
                      >
                        Ver inscrição
                      </Link>
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
