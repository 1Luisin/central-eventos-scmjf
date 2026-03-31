"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { getRequestErrorMessage, requestJson, requestVoid } from "@/lib/api/client";
import {
  formatBooleanFlag,
  formatDateTime,
  normalizeText,
  toApiDateTime,
  toTitleCaseFlag,
  trimOrUndefined
} from "@/lib/formatters";
import type {
  AdminData,
  CategoriaCreatePayload,
  EventoCreatePayload,
  EventoResponse
} from "@/types/api";

type AdminPageClientProps = {
  initialData: AdminData;
};

export function AdminPageClient({ initialData }: AdminPageClientProps) {
  const searchParams = useSearchParams();
  const requestedEventId = searchParams.get("eventoId");

  const [data, setData] = useState(initialData);
  const [selectedEventId, setSelectedEventId] = useState(requestedEventId || String(initialData.eventos[0]?.id ?? ""));
  const [feedback, setFeedback] = useState<string | null>(initialData.erroInicial ?? null);
  const [eventMessage, setEventMessage] = useState<string | null>(null);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [cancelingEnrollmentId, setCancelingEnrollmentId] = useState<number | null>(null);

  useEffect(() => {
    if (requestedEventId && data.eventos.some((evento) => String(evento.id) === requestedEventId)) {
      setSelectedEventId(requestedEventId);
      return;
    }

    if (!selectedEventId && data.eventos[0]) {
      setSelectedEventId(String(data.eventos[0].id));
    }
  }, [data.eventos, requestedEventId, selectedEventId]);

  const selectedEvent = data.eventos.find((evento) => String(evento.id) === selectedEventId) ?? null;

  async function refreshData(preferredEventId?: number) {
    try {
      setRefreshing(true);
      const payload = await requestJson<AdminData>("/api/portal/admin");
      setData(payload);
      setFeedback(payload.erroInicial ?? null);

      if (preferredEventId && payload.eventos.some((evento) => evento.id === preferredEventId)) {
        setSelectedEventId(String(preferredEventId));
      } else if (!payload.eventos.some((evento) => String(evento.id) === selectedEventId)) {
        setSelectedEventId(String(payload.eventos[0]?.id ?? ""));
      }
    } catch (error) {
      setFeedback(getRequestErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }

  async function handleEventSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEventMessage(null);
    setFeedback(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const dataHoraInicio = toApiDateTime(normalizeText(formData.get("dataHoraInicio")));
    const dataHoraFim = toApiDateTime(normalizeText(formData.get("dataHoraFim")));

    if (new Date(dataHoraFim).getTime() <= new Date(dataHoraInicio).getTime()) {
      setEventMessage("Data/hora final deve ser maior que a inicial.");
      return;
    }

    const payload: EventoCreatePayload = {
      nomeEvento: normalizeText(formData.get("nomeEvento")),
      dataHoraInicio,
      dataHoraFim,
      nomeResponsavel: normalizeText(formData.get("nomeResponsavel")),
      nomeSetor: normalizeText(formData.get("nomeSetor")),
      numeroContato: normalizeText(formData.get("numeroContato")),
      ativo: normalizeText(formData.get("ativo")) === "N" ? "N" : "S",
      descricao: trimOrUndefined(formData.get("descricao"))
    };

    try {
      setEventSubmitting(true);
      const created = await requestJson<EventoResponse>("/api/eventos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Usuario-Log": payload.nomeResponsavel
        },
        body: JSON.stringify(payload)
      });

      form.reset();
      setSelectedEventId(String(created.id));
      setEventMessage(`Evento "${created.nomeEvento}" cadastrado com sucesso.`);
      await refreshData(created.id);
    } catch (error) {
      setEventMessage(getRequestErrorMessage(error));
    } finally {
      setEventSubmitting(false);
    }
  }

  async function handleCategorySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategoryMessage(null);
    setFeedback(null);

    if (!selectedEvent) {
      setCategoryMessage("Cadastre um evento antes de registrar categorias.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload: CategoriaCreatePayload = {
      eventoId: Number(selectedEventId),
      nomeCategoria: normalizeText(formData.get("nomeCategoria")),
      externo: normalizeText(formData.get("externo")) === "S" ? "S" : "N",
      descricao: trimOrUndefined(formData.get("descricao")),
      ativo: normalizeText(formData.get("ativo")) === "N" ? "N" : "S",
      limiteInscricoes: Number(normalizeText(formData.get("limiteInscricoes")))
    };

    if (!Number.isFinite(payload.limiteInscricoes) || payload.limiteInscricoes <= 0) {
      setCategoryMessage("Informe um número de vagas maior que zero.");
      return;
    }

    try {
      setCategorySubmitting(true);
      await requestJson("/api/categorias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Usuario-Log": selectedEvent.nomeResponsavel
        },
        body: JSON.stringify(payload)
      });

      form.reset();
      setCategoryMessage(`Categoria criada com sucesso no evento "${selectedEvent.nomeEvento}".`);
      await refreshData(selectedEvent.id);
    } catch (error) {
      setCategoryMessage(getRequestErrorMessage(error));
    } finally {
      setCategorySubmitting(false);
    }
  }

  async function handleCancelEnrollment(inscricaoId: number, matricula: string, eventoId: number) {
    const confirmed = window.confirm(`Deseja cancelar a inscrição da matrícula ${matricula}?`);

    if (!confirmed) {
      return;
    }

    try {
      setCancelingEnrollmentId(inscricaoId);
      setFeedback(null);

      await requestVoid(`/api/inscricoes/${inscricaoId}`, {
        method: "DELETE",
        headers: {
          "X-Usuario-Log": matricula
        }
      });

      setFeedback("Inscrição cancelada com sucesso.");
      await refreshData(eventoId);
    } catch (error) {
      setFeedback(getRequestErrorMessage(error));
    } finally {
      setCancelingEnrollmentId(null);
    }
  }

  return (
    <div className="stack-xl">
      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Cadastro administrativo</span>
            <h2>Eventos, categorias e participantes</h2>
          </div>

          <button className="button button--secondary" type="button" onClick={() => refreshData()} disabled={refreshing}>
            {refreshing ? "Atualizando..." : "Atualizar dados"}
          </button>
        </div>

        <p className="section-copy">
          O frontend envia os mesmos contratos exigidos pela API, incluindo sinalização de ativo, vagas, público
          externo e cancelamento administrativo das inscrições.
        </p>

        {feedback ? <div className="feedback feedback--warning">{feedback}</div> : null}

        <div className="section-meta">
          <span>{data.eventos.length} evento(s) carregado(s)</span>
          <span>Última atualização: {formatDateTime(data.atualizadoEm)}</span>
        </div>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Novo evento</span>
              <h2>Cadastro principal</h2>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleEventSubmit}>
            <label className="field field--full">
              <span>NOME DO EVENTO</span>
              <input name="nomeEvento" type="text" placeholder="Ex.: Jornada de Enfermagem" required />
            </label>

            <label className="field">
              <span>DATA/HORA INÍCIO</span>
              <input name="dataHoraInicio" type="datetime-local" required />
            </label>

            <label className="field">
              <span>DATA/HORA FIM</span>
              <input name="dataHoraFim" type="datetime-local" required />
            </label>

            <label className="field">
              <span>NOME DO RESPONSÁVEL</span>
              <input name="nomeResponsavel" type="text" placeholder="Ex.: Maria da Silva" required />
            </label>

            <label className="field">
              <span>SETOR RESPONSÁVEL</span>
              <input name="nomeSetor" type="text" placeholder="Ex.: Educação Continuada" required />
            </label>

            <label className="field">
              <span>CONTATO</span>
              <input name="numeroContato" type="text" placeholder="Telefone, ramal ou celular" required />
            </label>

            <label className="field">
              <span>SITUAÇÃO DO EVENTO</span>
              <select name="ativo" defaultValue="S">
                <option value="S">Ativo</option>
                <option value="N">Inativo</option>
              </select>
            </label>

            <label className="field field--full">
              <span>DESCRIÇÃO</span>
              <textarea
                name="descricao"
                rows={4}
                placeholder="Resumo do evento, público-alvo e observações gerais."
              />
            </label>

            {eventMessage ? <div className="feedback feedback--info field field--full">{eventMessage}</div> : null}

            <div className="form-actions field field--full">
              <button className="button button--primary" type="submit" disabled={eventSubmitting}>
                {eventSubmitting ? "Salvando..." : "Salvar evento"}
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Nova categoria</span>
              <h2>Cadastro vinculado ao evento</h2>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleCategorySubmit}>
            <label className="field field--full">
              <span>EVENTO DO CADASTRO</span>
              <select
                name="eventoId"
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                disabled={data.eventos.length === 0}
              >
                {data.eventos.length === 0 ? (
                  <option value="">Cadastre um evento primeiro</option>
                ) : (
                  data.eventos.map((evento) => (
                    <option key={evento.id} value={evento.id}>
                      {evento.nomeEvento} {evento.ativo === "S" ? "(ativo)" : "(inativo)"}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="field field--full">
              <span>NOME DA CATEGORIA</span>
              <input name="nomeCategoria" type="text" placeholder="Ex.: Oficina prática" required />
            </label>

            <label className="field">
              <span>VAGAS</span>
              <input name="limiteInscricoes" type="number" min="1" step="1" placeholder="Ex.: 40" required />
            </label>

            <label className="field">
              <span>INSCRIÇÃO EXTERNA</span>
              <select name="externo" defaultValue="N">
                <option value="N">Não permite</option>
                <option value="S">Permite</option>
              </select>
            </label>

            <label className="field">
              <span>SITUAÇÃO DA CATEGORIA</span>
              <select name="ativo" defaultValue="S">
                <option value="S">Ativa</option>
                <option value="N">Inativa</option>
              </select>
            </label>

            <label className="field field--full">
              <span>DESCRIÇÃO DA CATEGORIA</span>
              <textarea
                name="descricao"
                rows={4}
                placeholder="Descreva formato, público e orientações desta categoria."
              />
            </label>

            {categoryMessage ? <div className="feedback feedback--info field field--full">{categoryMessage}</div> : null}

            <div className="form-actions field field--full">
              <button
                className="button button--primary"
                type="submit"
                disabled={categorySubmitting || data.eventos.length === 0}
              >
                {categorySubmitting ? "Salvando..." : "Salvar categoria"}
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="stack-lg">
        {data.eventos.length === 0 ? (
          <section className="panel empty-panel">
            <span className="empty-panel__badge">Base vazia</span>
            <h3>Nenhum evento foi cadastrado ainda.</h3>
            <p>Assim que o primeiro evento for salvo, as categorias e os inscritos aparecerão nesta área.</p>
          </section>
        ) : (
          data.eventos.map((evento) => (
            <article className="panel event-admin-card" key={evento.id}>
              <div className="event-card__header">
                <div>
                  <span className="eyebrow">Evento #{evento.id}</span>
                  <h2>{evento.nomeEvento}</h2>
                </div>

                <div className="badge-row">
                  <span className={evento.ativo === "S" ? "badge badge--success" : "badge badge--danger"}>
                    {toTitleCaseFlag(evento.ativo, "Evento ativo", "Evento inativo")}
                  </span>
                  <span className="badge badge--ghost">{evento.totalCategorias} categoria(s)</span>
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
                <span>{evento.totalInscricoes} inscrição(ões)</span>
                <span>{evento.totalVagas} vaga(s) somadas nas categorias</span>
              </div>

              {evento.categorias.length === 0 ? (
                <div className="inline-empty">Nenhuma categoria cadastrada para este evento.</div>
              ) : (
                <div className="admin-category-grid">
                  {evento.categorias.map((categoria) => (
                    <section className="category-card category-card--admin" key={categoria.id}>
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
                          {formatBooleanFlag(categoria.externo, "Permite inscrições externas", "Somente público interno")}
                        </span>
                        <span className={categoria.ativo === "S" ? "badge badge--neutral" : "badge badge--danger"}>
                          {toTitleCaseFlag(categoria.ativo, "Categoria ativa", "Categoria inativa")}
                        </span>
                      </div>

                      <div className="occupancy">
                        <div className="occupancy__track">
                          <div
                            className="occupancy__value"
                            style={{ width: `${categoria.ocupacaoPercentual}%` }}
                          />
                        </div>
                        <div className="occupancy__legend">
                          <span>
                            {categoria.inscricoesRealizadas}/{categoria.limiteInscricoes} inscrições
                          </span>
                          <strong>{categoria.vagasDisponiveis} vaga(s) restantes</strong>
                        </div>
                      </div>

                      <div className="participants-block">
                        <div className="participants-block__header">
                          <h5>Participantes inscritos</h5>
                          <span>{categoria.inscricoes.length} registro(s)</span>
                        </div>

                        {categoria.inscricoes.length === 0 ? (
                          <div className="inline-empty inline-empty--soft">Nenhum participante inscrito nesta categoria.</div>
                        ) : (
                          <ul className="participants-list">
                            {categoria.inscricoes.map((inscricao) => (
                              <li className="participant-item" key={inscricao.id}>
                                <div>
                                  <strong>{inscricao.nomeUsuario}</strong>
                                  <span>Matrícula {inscricao.matricula}</span>
                                  <span>
                                    {inscricao.nomeSetor} • {inscricao.numeroContato}
                                  </span>
                                  <span>Registrado em {formatDateTime(inscricao.dataHoraRegistro)}</span>
                                </div>

                                <button
                                  className="button button--danger"
                                  type="button"
                                  onClick={() =>
                                    handleCancelEnrollment(inscricao.id, inscricao.matricula, evento.id)
                                  }
                                  disabled={cancelingEnrollmentId === inscricao.id}
                                >
                                  {cancelingEnrollmentId === inscricao.id ? "Cancelando..." : "Cancelar"}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
