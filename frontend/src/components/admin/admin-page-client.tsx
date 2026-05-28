"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ScmjfSelect from "@scmjf/select-component";

import { DateTimePickerField } from "@/components/forms/date-time-picker-field";
import { getRequestErrorMessage, requestJson, requestVoid } from "@/lib/api/client";
import type { SessionUserContext } from "@/lib/auth/session";
import {
  formatBooleanFlag,
  formatCountLabel,
  formatDateTime,
  formatFractionLabel,
  normalizeText,
  toApiDateTimeFromDate,
  toTitleCaseFlag,
  trimOrUndefined
} from "@/lib/formatters";
import type {
  AdminData,
  CategoriaAdminItem,
  CategoriaCreatePayload,
  EventoCreatePayload,
  EventoResponse
} from "@/types/api";

type AdminPageClientProps = {
  initialData: AdminData;
  sessionContext: SessionUserContext;
};

type EventFormState = {
  nomeEvento: string;
  nomeResponsavel: string;
  nomeSetor: string;
  numeroContato: string;
  ativo: "S" | "N";
  descricao: string;
};

type CategoryFormState = {
  nomeCategoria: string;
  limiteInscricoes: string;
  externo: "S" | "N";
  ativo: "S" | "N";
  descricao: string;
};

export function AdminPageClient({ initialData, sessionContext }: AdminPageClientProps) {
  const searchParams = useSearchParams();
  const requestedEventId = searchParams.get("eventoId");
  const loggedAdminName = sessionContext.internalUser?.nomeUsuario ?? sessionContext.displayName ?? "";

  const [data, setData] = useState(initialData);
  const [selectedEventId, setSelectedEventId] = useState(requestedEventId || String(initialData.eventos[0]?.id ?? ""));
  const [feedback, setFeedback] = useState<string | null>(initialData.erroInicial ?? null);
  const [eventMessage, setEventMessage] = useState<string | null>(null);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [cancelingEnrollmentId, setCancelingEnrollmentId] = useState<number | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState<EventFormState>(createDefaultEventForm(loggedAdminName));
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(createDefaultCategoryForm());
  const [eventStartDate, setEventStartDate] = useState<Date | null>(null);
  const [eventEndDate, setEventEndDate] = useState<Date | null>(null);
  const [setores, setSetores] = useState<string[]>([]);
  const [setoresFeedback, setSetoresFeedback] = useState<string | null>(null);
  const [loadingSetores, setLoadingSetores] = useState(false);

  useEffect(() => {
    if (requestedEventId && data.eventos.some((evento) => String(evento.id) === requestedEventId)) {
      setSelectedEventId(requestedEventId);
      return;
    }

    if (!selectedEventId && data.eventos[0]) {
      setSelectedEventId(String(data.eventos[0].id));
    }
  }, [data.eventos, requestedEventId, selectedEventId]);

  useEffect(() => {
    let cancelled = false;

    async function loadSetores() {
      try {
        setLoadingSetores(true);
        setSetoresFeedback(null);

        const payload = await requestJson<string[]>("/api/setores");

        if (cancelled) {
          return;
        }

        setSetores(payload);
        setSetoresFeedback(payload.length === 0 ? "Nenhum setor foi encontrado para seleção." : null);
      } catch (error) {
        if (!cancelled) {
          setSetoresFeedback(getRequestErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoadingSetores(false);
        }
      }
    }

    void loadSetores();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (editingEventId === null) {
      return;
    }

    const editingEvent = data.eventos.find((evento) => evento.id === editingEventId);

    if (!editingEvent) {
      resetEventForm(setEditingEventId, setEventForm, setEventStartDate, setEventEndDate, loggedAdminName);
      return;
    }

    setEventForm(mapEventToForm(editingEvent));
    setEventStartDate(new Date(editingEvent.dataHoraInicio));
    setEventEndDate(new Date(editingEvent.dataHoraFim));
  }, [data.eventos, editingEventId, loggedAdminName]);

  useEffect(() => {
    if (editingCategoryId === null) {
      return;
    }

    const editingCategory = findCategoryById(data, editingCategoryId);

    if (!editingCategory) {
      resetCategoryForm(setEditingCategoryId, setCategoryForm);
      return;
    }

    setSelectedEventId(String(editingCategory.eventoId));
    setCategoryForm(mapCategoryToForm(editingCategory));
  }, [data, editingCategoryId]);

  const selectedEvent = data.eventos.find((evento) => String(evento.id) === selectedEventId) ?? null;
  const setorOptions =
    eventForm.nomeSetor && !setores.includes(eventForm.nomeSetor) ? [eventForm.nomeSetor, ...setores] : setores;
  const setorSelectDisabled = loadingSetores || setorOptions.length === 0;

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

    const dataHoraInicio = toApiDateTimeFromDate(eventStartDate);
    const dataHoraFim = toApiDateTimeFromDate(eventEndDate);

    if (!dataHoraInicio || !dataHoraFim) {
      setEventMessage("Informe a data e o horário de início e fim do evento.");
      return;
    }

    if (new Date(dataHoraFim).getTime() <= new Date(dataHoraInicio).getTime()) {
      setEventMessage("A data e o horário de término devem ser maiores que o início.");
      return;
    }

    if (setorSelectDisabled || !eventForm.nomeSetor.trim()) {
      setEventMessage(setoresFeedback || "Selecione o setor responsável.");
      return;
    }

    const payload: EventoCreatePayload = {
      nomeEvento: eventForm.nomeEvento.trim(),
      dataHoraInicio,
      dataHoraFim,
      nomeResponsavel: eventForm.nomeResponsavel.trim(),
      nomeSetor: eventForm.nomeSetor.trim(),
      numeroContato: eventForm.numeroContato.trim(),
      ativo: eventForm.ativo,
      descricao: trimOrUndefined(eventForm.descricao)
    };

    try {
      setEventSubmitting(true);

      const saved = await requestJson<EventoResponse>(
        editingEventId === null ? "/api/eventos" : `/api/eventos/${editingEventId}`,
        {
          method: editingEventId === null ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      setSelectedEventId(String(saved.id));
      setEventMessage(
        editingEventId === null
          ? `Evento "${saved.nomeEvento}" cadastrado com sucesso.`
          : `Evento "${saved.nomeEvento}" atualizado com sucesso.`
      );

      if (editingEventId === null) {
        resetEventForm(setEditingEventId, setEventForm, setEventStartDate, setEventEndDate, loggedAdminName);
      } else {
        setEditingEventId(saved.id);
      }

      await refreshData(saved.id);
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
      setCategoryMessage("Cadastre um evento antes de criar categorias.");
      return;
    }

    const payload: CategoriaCreatePayload = {
      eventoId: Number(selectedEventId),
      nomeCategoria: categoryForm.nomeCategoria.trim(),
      externo: categoryForm.externo,
      descricao: trimOrUndefined(categoryForm.descricao),
      ativo: categoryForm.ativo,
      limiteInscricoes: Number(categoryForm.limiteInscricoes)
    };

    if (!Number.isFinite(payload.limiteInscricoes) || payload.limiteInscricoes <= 0) {
      setCategoryMessage("Informe uma quantidade de vagas maior que zero.");
      return;
    }

    try {
      setCategorySubmitting(true);
      await requestJson(editingCategoryId === null ? "/api/categorias" : `/api/categorias/${editingCategoryId}`, {
        method: editingCategoryId === null ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      setCategoryMessage(
        editingCategoryId === null
          ? `Categoria cadastrada com sucesso no evento "${selectedEvent.nomeEvento}".`
          : "Categoria atualizada com sucesso."
      );
      resetCategoryForm(setEditingCategoryId, setCategoryForm);
      await refreshData(selectedEvent.id);
    } catch (error) {
      setCategoryMessage(getRequestErrorMessage(error));
    } finally {
      setCategorySubmitting(false);
    }
  }

  async function handleCancelEnrollment(inscricaoId: number, participantLabel: string, eventoId: number) {
    const confirmed = window.confirm(`Deseja cancelar a inscrição de ${participantLabel}?`);

    if (!confirmed) {
      return;
    }

    try {
      setCancelingEnrollmentId(inscricaoId);
      setFeedback(null);

      await requestVoid(`/api/inscricoes/${inscricaoId}`, {
        method: "DELETE"
      });

      setFeedback("Inscrição cancelada com sucesso.");
      await refreshData(eventoId);
    } catch (error) {
      setFeedback(getRequestErrorMessage(error));
    } finally {
      setCancelingEnrollmentId(null);
    }
  }

  function startEditingEvent(evento: EventoResponse) {
    setEditingEventId(evento.id);
    setSelectedEventId(String(evento.id));
    setEventForm(mapEventToForm(evento));
    setEventStartDate(new Date(evento.dataHoraInicio));
    setEventEndDate(new Date(evento.dataHoraFim));
    setEventMessage(null);
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEditingCategory(categoria: CategoriaAdminItem) {
    setEditingCategoryId(categoria.id);
    setSelectedEventId(String(categoria.eventoId));
    setCategoryForm(mapCategoryToForm(categoria));
    setCategoryMessage(null);
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="stack-xl">
      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Resumo</span>
            <h2>Cadastrar eventos</h2>
          </div>

          <button className="button button--secondary" type="button" onClick={() => refreshData()} disabled={refreshing}>
            {refreshing ? "Atualizando..." : "Atualizar lista"}
          </button>
        </div>

        {feedback ? <div className="feedback feedback--warning">{feedback}</div> : null}

        <div className="section-meta">
          <span>{formatCountLabel(data.eventos.length, "evento cadastrado", "eventos cadastrados")}</span>
          <span>Última atualização: {formatDateTime(data.atualizadoEm)}</span>
        </div>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="section-heading section-heading--with-step">
            <span className="step-badge">1</span>
            <div>
              <span className="eyebrow">{editingEventId === null ? "Novo evento" : "Editar evento"}</span>
              <h2>{editingEventId === null ? "Dados do evento" : "Atualização do evento"}</h2>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleEventSubmit}>
            <label className="field field--full">
              <span>NOME DO EVENTO</span>
              <input
                name="nomeEvento"
                type="text"
                placeholder="Ex.: Jornada de Enfermagem"
                required
                value={eventForm.nomeEvento}
                onChange={(event) => updateEventFormField(setEventForm, "nomeEvento", event.target.value)}
              />
            </label>

            <DateTimePickerField
              label="DATA/HORA INÍCIO"
              onChange={(nextValue) => {
                setEventStartDate(nextValue);

                if (eventEndDate && nextValue && eventEndDate.getTime() < nextValue.getTime()) {
                  setEventEndDate(nextValue);
                }
              }}
              value={eventStartDate}
            />

            <DateTimePickerField
              label="DATA/HORA FIM"
              minDate={eventStartDate ?? undefined}
              onChange={setEventEndDate}
              value={eventEndDate}
            />

            <label className="field">
              <span>NOME DO RESPONSÁVEL</span>
              <input
                name="nomeResponsavel"
                type="text"
                placeholder="Ex.: Maria da Silva"
                required
                value={eventForm.nomeResponsavel}
                onChange={(event) => updateEventFormField(setEventForm, "nomeResponsavel", event.target.value)}
              />
            </label>

            <div className="field">
              <span>SETOR RESPONSÁVEL</span>
              <ScmjfSelect
                aria-label="Setor responsável"
                name="nomeSetor"
                required
                value={eventForm.nomeSetor}
                onChange={(event) => updateEventFormField(setEventForm, "nomeSetor", event.target.value)}
                disabled={setorSelectDisabled}
                placeholder={
                  loadingSetores
                    ? "Carregando setores..."
                    : setorOptions.length === 0
                      ? "Nenhum setor disponível"
                      : "Selecione o setor"
                }
                searchPlaceholder="Buscar setor..."
                emptyMessage="Nenhum setor encontrado"
              >
                {setorOptions.map((setor) => (
                  <option key={setor} value={setor}>
                    {setor}
                  </option>
                ))}
              </ScmjfSelect>
            </div>

            <label className="field">
              <span>CONTATO</span>
              <input
                name="numeroContato"
                type="text"
                placeholder="Telefone, ramal ou celular"
                required
                value={eventForm.numeroContato}
                onChange={(event) => updateEventFormField(setEventForm, "numeroContato", event.target.value)}
              />
            </label>

            <div className="field">
              <span>SITUAÇÃO DO EVENTO</span>
              <ScmjfSelect
                aria-label="Situação do evento"
                name="ativo"
                value={eventForm.ativo}
                onChange={(event) => updateEventFormField(setEventForm, "ativo", event.target.value as "S" | "N")}
                searchable={false}
              >
                <option value="S">Ativo</option>
                <option value="N">Inativo</option>
              </ScmjfSelect>
            </div>

            <label className="field field--full">
              <span>DESCRIÇÃO</span>
              <textarea
                name="descricao"
                rows={4}
                placeholder="Resumo do evento, público-alvo e orientações gerais."
                value={eventForm.descricao}
                onChange={(event) => updateEventFormField(setEventForm, "descricao", event.target.value)}
              />
            </label>

            {setoresFeedback ? <div className="feedback feedback--warning field field--full">{setoresFeedback}</div> : null}
            {eventMessage ? <div className="feedback feedback--info field field--full">{eventMessage}</div> : null}

            <div className="form-actions field field--full">
              <button className="button button--primary" type="submit" disabled={eventSubmitting || setorSelectDisabled}>
                {eventSubmitting
                  ? editingEventId === null
                    ? "Salvando..."
                    : "Atualizando..."
                  : editingEventId === null
                    ? "Salvar evento"
                    : "Salvar alterações"}
              </button>

              {editingEventId !== null ? (
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() =>
                    resetEventForm(setEditingEventId, setEventForm, setEventStartDate, setEventEndDate, loggedAdminName)
                  }
                >
                  Cancelar edição
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="panel">
          <div className="section-heading section-heading--with-step">
            <span className="step-badge">2</span>
            <div>
              <span className="eyebrow">{editingCategoryId === null ? "Nova categoria" : "Editar categoria"}</span>
              <h2>{editingCategoryId === null ? "Categoria do evento" : "Atualização da categoria"}</h2>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleCategorySubmit}>
            <div className="field field--full">
              <span>EVENTO</span>
              <ScmjfSelect
                aria-label="Evento"
                name="eventoId"
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                disabled={data.eventos.length === 0 || editingCategoryId !== null}
                placeholder={data.eventos.length === 0 ? "Cadastre um evento primeiro" : "Selecione o evento"}
                searchPlaceholder="Buscar evento..."
                emptyMessage="Nenhum evento encontrado"
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
              </ScmjfSelect>
            </div>

            <label className="field field--full">
              <span>NOME DA CATEGORIA</span>
              <input
                name="nomeCategoria"
                type="text"
                placeholder="Ex.: Oficina prática"
                required
                value={categoryForm.nomeCategoria}
                onChange={(event) => updateCategoryFormField(setCategoryForm, "nomeCategoria", event.target.value)}
              />
            </label>

            <label className="field">
              <span>VAGAS</span>
              <input
                name="limiteInscricoes"
                type="number"
                min="1"
                step="1"
                placeholder="Ex.: 40"
                required
                value={categoryForm.limiteInscricoes}
                onChange={(event) => updateCategoryFormField(setCategoryForm, "limiteInscricoes", event.target.value)}
              />
            </label>

            <div className="field">
              <span>INSCRIÇÃO EXTERNA</span>
              <ScmjfSelect
                aria-label="Inscrição externa"
                name="externo"
                value={categoryForm.externo}
                onChange={(event) => updateCategoryFormField(setCategoryForm, "externo", event.target.value as "S" | "N")}
                searchable={false}
              >
                <option value="N">Não permite</option>
                <option value="S">Permite</option>
              </ScmjfSelect>
            </div>

            <div className="field">
              <span>SITUAÇÃO DA CATEGORIA</span>
              <ScmjfSelect
                aria-label="Situação da categoria"
                name="ativo"
                value={categoryForm.ativo}
                onChange={(event) => updateCategoryFormField(setCategoryForm, "ativo", event.target.value as "S" | "N")}
                searchable={false}
              >
                <option value="S">Ativa</option>
                <option value="N">Inativa</option>
              </ScmjfSelect>
            </div>

            <label className="field field--full">
              <span>DESCRIÇÃO DA CATEGORIA</span>
              <textarea
                name="descricao"
                rows={4}
                placeholder="Descreva o formato, o público e as orientações desta categoria."
                value={categoryForm.descricao}
                onChange={(event) => updateCategoryFormField(setCategoryForm, "descricao", event.target.value)}
              />
            </label>

            {categoryMessage ? <div className="feedback feedback--info field field--full">{categoryMessage}</div> : null}

            <div className="form-actions field field--full">
              <button
                className="button button--primary"
                type="submit"
                disabled={categorySubmitting || data.eventos.length === 0}
              >
                {categorySubmitting
                  ? editingCategoryId === null
                    ? "Salvando..."
                    : "Atualizando..."
                  : editingCategoryId === null
                    ? "Salvar categoria"
                    : "Salvar alterações"}
              </button>

              {editingCategoryId !== null ? (
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => resetCategoryForm(setEditingCategoryId, setCategoryForm)}
                >
                  Cancelar edição
                </button>
              ) : null}
            </div>
          </form>
        </article>
      </section>

      <section className="stack-lg">
        <div className="list-heading">
          <div>
            <span className="eyebrow">Eventos cadastrados</span>
            <h2>Meus eventos cadastrados</h2>
          </div>
        </div>

        {data.eventos.length === 0 ? (
          <section className="panel empty-panel">
            <span className="empty-panel__badge">Nenhum evento cadastrado</span>
            <h3>Você ainda não cadastrou nenhum evento.</h3>
            <p>Assim que o primeiro evento for salvo, ele aparecerá aqui com as categorias e inscrições relacionadas.</p>
          </section>
        ) : (
          data.eventos.map((evento) => (
            <article className="panel event-admin-card" key={evento.id}>
              <div className="event-card__header">
                <div>
                  <span className="eyebrow">Evento #{evento.id}</span>
                  <h2 className="event-title">{evento.nomeEvento}</h2>
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

              {evento.descricao ? <p className="event-card__description">{evento.descricao}</p> : null}

              <div className="card-actions">
                <button className="button button--secondary" type="button" onClick={() => startEditingEvent(evento)}>
                  {editingEventId === evento.id ? "Editando este evento" : "Editar evento"}
                </button>
                <button
                  className={selectedEventId === String(evento.id) ? "button button--primary" : "button button--secondary"}
                  type="button"
                  onClick={() => setSelectedEventId(String(evento.id))}
                >
                  {selectedEventId === String(evento.id) ? "Selecionado para categoria" : "Criar categoria neste evento"}
                </button>
              </div>

              <div className="summary-strip">
                <span>{formatCountLabel(evento.totalInscricoes, "inscrição", "inscrições")}</span>
                <span>{formatCountLabel(evento.totalVagas, "vaga distribuída nas categorias", "vagas distribuídas nas categorias")}</span>
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
                          {categoria.descricao ? <p>{categoria.descricao}</p> : null}
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

                      <div className="card-actions">
                        <button className="button button--secondary" type="button" onClick={() => startEditingCategory(categoria)}>
                          {editingCategoryId === categoria.id ? "Editando esta categoria" : "Editar categoria"}
                        </button>
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
                            {formatFractionLabel(categoria.inscricoesRealizadas, categoria.limiteInscricoes, "inscrição", "inscrições")}
                          </span>
                          <strong>{formatCountLabel(categoria.vagasDisponiveis, "vaga restante", "vagas restantes")}</strong>
                        </div>
                      </div>

                      <div className="participants-block">
                        <div className="participants-block__header">
                          <h5>Participantes inscritos</h5>
                          <span>{formatCountLabel(categoria.inscricoes.length, "registro", "registros")}</span>
                        </div>

                        {categoria.inscricoes.length === 0 ? (
                          <div className="inline-empty inline-empty--soft">Nenhum participante inscrito nesta categoria.</div>
                        ) : (
                          <ul className="participants-list">
                            {categoria.inscricoes.map((inscricao) => (
                              <li className="participant-item" key={inscricao.id}>
                                <div>
                                  <strong>{inscricao.nomeUsuario}</strong>
                                  <span>
                                    {inscricao.tipoParticipante === "EXTERNO"
                                      ? "Participante externo"
                                      : `Matrícula ${inscricao.matricula}`}
                                  </span>
                                  <span>
                                    {inscricao.tipoParticipante === "EXTERNO"
                                      ? `CPF ${inscricao.matricula} • ${inscricao.numeroContato}`
                                      : `${inscricao.nomeSetor} • ${inscricao.numeroContato}`}
                                  </span>
                                  <span>Registrado em {formatDateTime(inscricao.dataHoraRegistro)}</span>
                                </div>

                                <button
                                  className="button button--danger"
                                  type="button"
                                  onClick={() =>
                                    handleCancelEnrollment(
                                      inscricao.id,
                                      inscricao.tipoParticipante === "EXTERNO"
                                        ? inscricao.nomeUsuario
                                        : `matrícula ${inscricao.matricula}`,
                                      evento.id
                                    )
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

function createDefaultEventForm(loggedAdminName = ""): EventFormState {
  return {
    nomeEvento: "",
    nomeResponsavel: loggedAdminName,
    nomeSetor: "",
    numeroContato: "",
    ativo: "S",
    descricao: ""
  };
}

function createDefaultCategoryForm(): CategoryFormState {
  return {
    nomeCategoria: "",
    limiteInscricoes: "",
    externo: "N",
    ativo: "S",
    descricao: ""
  };
}

function mapEventToForm(evento: EventoResponse): EventFormState {
  return {
    nomeEvento: evento.nomeEvento,
    nomeResponsavel: evento.nomeResponsavel,
    nomeSetor: evento.nomeSetor,
    numeroContato: evento.numeroContato,
    ativo: evento.ativo === "N" ? "N" : "S",
    descricao: evento.descricao ?? ""
  };
}

function mapCategoryToForm(categoria: CategoriaAdminItem): CategoryFormState {
  return {
    nomeCategoria: categoria.nomeCategoria,
    limiteInscricoes: String(categoria.limiteInscricoes),
    externo: normalizeText(categoria.externo) === "S" ? "S" : "N",
    ativo: normalizeText(categoria.ativo) === "N" ? "N" : "S",
    descricao: categoria.descricao ?? ""
  };
}

function findCategoryById(data: AdminData, categoryId: number): CategoriaAdminItem | null {
  for (const evento of data.eventos) {
    const categoria = evento.categorias.find((item) => item.id === categoryId);
    if (categoria) {
      return categoria;
    }
  }

  return null;
}

function updateEventFormField(
  setEventForm: React.Dispatch<React.SetStateAction<EventFormState>>,
  field: keyof EventFormState,
  value: string
) {
  setEventForm((current) => ({
    ...current,
    [field]: value
  }));
}

function updateCategoryFormField(
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryFormState>>,
  field: keyof CategoryFormState,
  value: string
) {
  setCategoryForm((current) => ({
    ...current,
    [field]: value
  }));
}

function resetEventForm(
  setEditingEventId: React.Dispatch<React.SetStateAction<number | null>>,
  setEventForm: React.Dispatch<React.SetStateAction<EventFormState>>,
  setEventStartDate: React.Dispatch<React.SetStateAction<Date | null>>,
  setEventEndDate: React.Dispatch<React.SetStateAction<Date | null>>,
  loggedAdminName: string
) {
  setEditingEventId(null);
  setEventForm(createDefaultEventForm(loggedAdminName));
  setEventStartDate(null);
  setEventEndDate(null);
}

function resetCategoryForm(
  setEditingCategoryId: React.Dispatch<React.SetStateAction<number | null>>,
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryFormState>>
) {
  setEditingCategoryId(null);
  setCategoryForm(createDefaultCategoryForm());
}
