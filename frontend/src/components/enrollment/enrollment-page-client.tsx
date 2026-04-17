"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";

import { getRequestErrorMessage, requestJson } from "@/lib/api/client";
import type { SessionUserContext } from "@/lib/auth/session";
import {
  formatBooleanFlag,
  formatCountLabel,
  formatDateTime,
  formatFractionLabel,
  normalizeText,
  toTitleCaseFlag
} from "@/lib/formatters";
import type { CategoriaViewModel, EnrollmentData, InscricaoCreatePayload, InscricaoResponse } from "@/types/api";

type EnrollmentPageClientProps = {
  initialData: EnrollmentData;
  sessionContext: SessionUserContext;
};

type PageFeedbackTone = "warning" | "info";

export function EnrollmentPageClient({ initialData, sessionContext }: EnrollmentPageClientProps) {
  const searchParams = useSearchParams();
  const queryCategoryId = searchParams.get("categoriaId");
  const queryEventId = searchParams.get("eventoId");

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(queryCategoryId || "");
  const [isModalOpen, setIsModalOpen] = useState(Boolean(queryCategoryId));
  const [pageFeedback, setPageFeedback] = useState<string | null>(initialData.erroInicial ?? null);
  const [pageFeedbackTone, setPageFeedbackTone] = useState<PageFeedbackTone>(initialData.erroInicial ? "warning" : "info");
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const externalUser = sessionContext.accessMode === "externo" ? sessionContext.externalUser ?? null : null;
  const internalUser = sessionContext.accessMode === "interno" ? sessionContext.internalUser ?? null : null;

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const visibleEvents = useMemo(() => {
    const scopedEvents = data.eventos.filter((evento) => !queryEventId || String(evento.id) === queryEventId);

    return scopedEvents
      .map((evento) => ({
        ...evento,
        categorias: evento.categorias.filter((categoria) => {
          if (!normalizedSearch) {
            return true;
          }

          const haystack = [evento.nomeEvento, categoria.nomeCategoria, categoria.descricao ?? "", categoria.statusLabel]
            .join(" ")
            .toLowerCase();

          return haystack.includes(normalizedSearch);
        })
      }))
      .filter((evento) => evento.categorias.length > 0);
  }, [data.eventos, normalizedSearch, queryEventId]);

  const visibleCategories = useMemo(
    () => visibleEvents.flatMap((evento) => evento.categorias),
    [visibleEvents]
  );

  const selectedEvent = useMemo(
    () => (queryEventId ? data.eventos.find((evento) => String(evento.id) === queryEventId) ?? null : null),
    [data.eventos, queryEventId]
  );

  const activeCategory = visibleCategories.find((categoria) => String(categoria.id) === activeCategoryId) ?? null;
  const currentEnrollment = activeCategory?.inscricaoAtual ?? null;
  const alreadyEnrolled = currentEnrollment !== null;
  const categoriaPermiteExterno = activeCategory?.externo === "S";
  const canCurrentUserEnroll =
    !alreadyEnrolled &&
    (activeCategory?.permiteInscricao ?? false) &&
    (!externalUser || categoriaPermiteExterno);

  const visibleCategoryCount = visibleCategories.length;

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!queryCategoryId) {
      return;
    }

    if (visibleCategories.some((categoria) => String(categoria.id) === queryCategoryId)) {
      setActiveCategoryId(queryCategoryId);
      setIsModalOpen(true);
    }
  }, [queryCategoryId, visibleCategories]);

  useEffect(() => {
    if (!activeCategoryId) {
      return;
    }

    const categoryStillVisible = visibleCategories.some((categoria) => String(categoria.id) === activeCategoryId);
    if (!categoryStillVisible) {
      setActiveCategoryId("");
      setIsModalOpen(false);
      setModalFeedback(null);
    }
  }, [activeCategoryId, visibleCategories]);

  async function refreshData() {
    try {
      setRefreshing(true);
      const payload = await requestJson<EnrollmentData>("/api/portal/enrollment");
      setData(payload);

      if (payload.erroInicial) {
        setPageFeedback(payload.erroInicial);
        setPageFeedbackTone("warning");
      }
    } catch (error) {
      setPageFeedback(getRequestErrorMessage(error));
      setPageFeedbackTone("warning");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleEnrollmentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeCategory) {
      setModalFeedback("Selecione uma categoria para continuar.");
      return;
    }

    if (alreadyEnrolled) {
      setModalFeedback(null);
      return;
    }

    if (!activeCategory.permiteInscricao) {
      setModalFeedback(activeCategory.statusDescription);
      return;
    }

    if (externalUser && activeCategory.externo !== "S") {
      setModalFeedback("Esta categoria aceita apenas participantes internos.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload: InscricaoCreatePayload = externalUser
      ? {
          eventoId: activeCategory.eventoId,
          categoriaId: activeCategory.id,
          idUsuarioExterno: externalUser.idUsuarioExterno,
          numeroContato: normalizeText(formData.get("numeroContato")),
          nomeSetor: "Público externo"
        }
      : internalUser
        ? {
            eventoId: activeCategory.eventoId,
            categoriaId: activeCategory.id,
            numeroContato: normalizeText(formData.get("numeroContato")),
            nomeSetor: normalizeText(formData.get("nomeSetor")),
            nomeUsuario: internalUser.nomeUsuario,
            matricula: internalUser.matricula
          }
        : {
            eventoId: activeCategory.eventoId,
            categoriaId: activeCategory.id,
            numeroContato: normalizeText(formData.get("numeroContato")),
            nomeSetor: normalizeText(formData.get("nomeSetor")),
            nomeUsuario: normalizeText(formData.get("nomeUsuario")),
            matricula: normalizeText(formData.get("matricula"))
          };

    try {
      setSubmitting(true);
      setModalFeedback(null);

      await requestJson<InscricaoResponse>("/api/inscricoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      form.reset();
      await refreshData();
      setIsModalOpen(false);
      setPageFeedback(`Inscrição confirmada com sucesso em ${activeCategory.nomeCategoria}.`);
      setPageFeedbackTone("info");
    } catch (error) {
      const errorMessage = getRequestErrorMessage(error);

      if (errorMessage.toLowerCase().includes("já inscrito")) {
        await refreshData();
        setIsModalOpen(false);
        setPageFeedback(`Sua inscrição em ${activeCategory.nomeCategoria} já estava confirmada.`);
        setPageFeedbackTone("info");
        setModalFeedback(null);
      } else {
        setModalFeedback(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function openEnrollmentModal(categoryId: number) {
    setActiveCategoryId(String(categoryId));
    setModalFeedback(null);
    setIsModalOpen(true);
  }

  function closeEnrollmentModal() {
    setIsModalOpen(false);
    setModalFeedback(null);
  }

  function renderCategoryAction(category: CategoriaViewModel) {
    const isAlreadyEnrolled = category.inscricaoAtual !== null;
    const canEnrollInCategory =
      !isAlreadyEnrolled && category.permiteInscricao && (!externalUser || category.externo === "S");

    if (isAlreadyEnrolled) {
      return <span className="button button--secondary button--static">Inscrição confirmada</span>;
    }

    if (!canEnrollInCategory) {
      return <span className="button button--secondary button--static">Indisponível</span>;
    }

    return (
      <button className="button button--primary" type="button" onClick={() => openEnrollmentModal(category.id)}>
        Realizar inscrição
      </button>
    );
  }

  return (
    <div className="stack-xl">
      <article className="panel panel--enrollment-board">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Categorias disponíveis</span>
            <h2>{selectedEvent ? "Categorias do evento selecionado" : "Categorias abertas para inscrição"}</h2>
          </div>

          <div className="toolbar">
            <label className="search-field">
              <span className="search-field__label">Buscar categorias</span>
              <input
                type="search"
                placeholder="Procure por categoria"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <button className="button button--secondary" type="button" onClick={refreshData} disabled={refreshing}>
              {refreshing ? "Atualizando..." : "Atualizar lista"}
            </button>
          </div>
        </div>

        <p className="section-copy">
          {selectedEvent
            ? `Visualizando apenas as categorias do evento ${selectedEvent.nomeEvento}. Clique em uma categoria para abrir o pop-up de inscrição.`
            : "Escolha um evento e clique em uma categoria para abrir o pop-up de inscrição do participante."}
        </p>

        {pageFeedback ? <div className={`feedback feedback--${pageFeedbackTone}`}>{pageFeedback}</div> : null}

        <div className="section-meta">
          <span>{formatCountLabel(visibleCategoryCount, "categoria disponível", "categorias disponíveis")}</span>
          <span>Última atualização: {formatDateTime(data.atualizadoEm)}</span>
        </div>
      </article>

      {visibleEvents.length === 0 ? (
        <article className="panel empty-panel">
          <span className="empty-panel__badge">Nenhuma categoria encontrada</span>
          <h3>Não encontramos categorias compatíveis com o filtro informado.</h3>
          <p>Altere o termo pesquisado ou atualize a lista para tentar novamente.</p>
        </article>
      ) : (
        <section className="stack-xl">
          {visibleEvents.map((evento) => (
            <article className="panel" key={evento.id}>
              <div className="section-heading">
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
                  <span>Período</span>
                  <strong>
                    {formatDateTime(evento.dataHoraInicio)} até {formatDateTime(evento.dataHoraFim)}
                  </strong>
                </div>
                <div className="meta-pill">
                  <span>Setor responsável</span>
                  <strong>{evento.nomeSetor}</strong>
                </div>
              </div>

              {evento.descricao ? <p className="event-card__description">{evento.descricao}</p> : null}

              <div className="category-grid">
                {evento.categorias.map((categoria) => {
                  const isAlreadyEnrolled = categoria.inscricaoAtual !== null;
                  const badgeClass = isAlreadyEnrolled
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
                        <span className={badgeClass}>{isAlreadyEnrolled ? "Inscrição confirmada" : categoria.statusLabel}</span>
                      </div>

                      <div className="badge-row">
                        <span className="badge badge--ghost">
                          {formatBooleanFlag(categoria.externo, "Aceita público externo", "Somente público interno")}
                        </span>
                        <span className={categoria.ativo === "S" ? "badge badge--neutral" : "badge badge--danger"}>
                          {toTitleCaseFlag(categoria.ativo, "Categoria ativa", "Categoria inativa")}
                        </span>
                        {isAlreadyEnrolled ? <span className="badge badge--success">Você já está inscrito</span> : null}
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
                        {isAlreadyEnrolled
                          ? "Sua vaga nesta categoria já está confirmada. Não é necessário realizar uma nova inscrição."
                          : externalUser && categoria.externo !== "S"
                            ? "Esta categoria aceita apenas participantes internos. Escolha outra opção para continuar."
                            : categoria.statusDescription}
                      </p>

                      <div className="card-actions">{renderCategoryAction(categoria)}</div>
                    </section>
                  );
                })}
              </div>
            </article>
          ))}
        </section>
      )}

      {portalReady && isModalOpen && activeCategory
        ? createPortal(
            <div className="modal-overlay" role="presentation" onClick={closeEnrollmentModal}>
              <div
                className="modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="enrollment-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-card__header">
                  <div>
                    <span className="eyebrow">Formulário de inscrição</span>
                    <h3 id="enrollment-modal-title">{activeCategory.nomeCategoria}</h3>
                    <p>{activeCategory.eventoNome}</p>
                  </div>

                  <button className="modal-card__close" type="button" onClick={closeEnrollmentModal} aria-label="Fechar inscrição">
                    Fechar
                  </button>
                </div>

                <div className="modal-card__body">
                  <div className="selection-card">
                    <span className="badge badge--ghost">Seleção atual</span>
                    <div className="badge-row">
                      <span className={alreadyEnrolled || canCurrentUserEnroll ? "badge badge--success" : "badge badge--danger"}>
                        {alreadyEnrolled
                          ? "Inscrição confirmada"
                          : externalUser && !categoriaPermiteExterno
                            ? "Somente público interno"
                            : activeCategory.statusLabel}
                      </span>
                      <span className="badge badge--ghost">
                        {formatBooleanFlag(activeCategory.externo, "Inscrição externa permitida", "Somente público interno")}
                      </span>
                    </div>

                    <p>{activeCategory.descricao || "Categoria sem descrição complementar."}</p>

                    <div className="selection-card__meta">
                      <span>
                        Período: {formatDateTime(activeCategory.eventoInicio)} até {formatDateTime(activeCategory.eventoFim)}
                      </span>
                      <span>{formatCountLabel(activeCategory.vagasDisponiveis, "vaga disponível", "vagas disponíveis")}</span>
                    </div>

                    <p className="category-card__footnote">
                      {alreadyEnrolled
                        ? "Sua participação já está confirmada nesta categoria."
                        : externalUser && !categoriaPermiteExterno
                          ? "Esta categoria aceita apenas participantes internos."
                          : activeCategory.statusDescription}
                    </p>
                  </div>

                  {externalUser ? (
                    <div className="selection-card modal-card__section">
                      <span className="badge badge--ghost">Participante identificado</span>
                      <h3>{externalUser.nomeCompleto}</h3>
                      <div className="selection-card__meta">
                        <span>E-mail: {externalUser.email}</span>
                        <span>CPF: {externalUser.cpf}</span>
                        <span>Usuário externo</span>
                      </div>
                    </div>
                  ) : internalUser ? (
                    <div className="selection-card modal-card__section">
                      <span className="badge badge--ghost">Participante identificado</span>
                      <h3>{internalUser.nomeUsuario}</h3>
                      <div className="selection-card__meta">
                        <span>Matrícula: {internalUser.matricula}</span>
                        <span>E-mail: {internalUser.email || "Não informado"}</span>
                        <span>Usuário interno</span>
                      </div>
                    </div>
                  ) : null}

                  {currentEnrollment ? (
                    <div className="confirmation-card modal-card__section">
                      <div className="confirmation-card__header">
                        <div>
                          <span className="eyebrow">Inscrição confirmada</span>
                          <h3>Você já está inscrito nesta categoria</h3>
                        </div>
                        <span className="badge badge--success">Inscrito</span>
                      </div>

                      <p>
                        Sua vaga está reservada na categoria <strong>{activeCategory.nomeCategoria}</strong>, do evento <strong>{activeCategory.eventoNome}</strong>.
                      </p>

                      <div className="confirmation-card__grid">
                        <div className="confirmation-card__item">
                          <span>Participante</span>
                          <strong>{currentEnrollment.nomeUsuario}</strong>
                        </div>
                        <div className="confirmation-card__item">
                          <span>{currentEnrollment.tipoParticipante === "EXTERNO" ? "CPF" : "Matrícula"}</span>
                          <strong>{currentEnrollment.matricula}</strong>
                        </div>
                        <div className="confirmation-card__item">
                          <span>{currentEnrollment.tipoParticipante === "EXTERNO" ? "Usuário" : "Setor"}</span>
                          <strong>
                            {currentEnrollment.tipoParticipante === "EXTERNO" ? "Usuário externo" : currentEnrollment.nomeSetor}
                          </strong>
                        </div>
                        <div className="confirmation-card__item">
                          <span>Contato</span>
                          <strong>{currentEnrollment.numeroContato}</strong>
                        </div>
                      </div>

                      <div className="confirmation-card__meta">
                        <span>Registro realizado em {formatDateTime(currentEnrollment.dataHoraRegistro)}</span>
                        <span>O sistema bloqueou novas tentativas porque sua inscrição já está confirmada.</span>
                      </div>
                    </div>
                  ) : null}

                  {modalFeedback ? <div className="feedback feedback--warning">{modalFeedback}</div> : null}

                  {alreadyEnrolled ? null : (
                    <form className="form-grid" onSubmit={handleEnrollmentSubmit}>
                      {externalUser ? (
                        <>
                          <label className="field field--full">
                            <span>Nome do participante</span>
                            <input type="text" value={externalUser.nomeCompleto} disabled />
                          </label>

                          <label className="field field--full">
                            <span>CPF</span>
                            <input type="text" value={externalUser.cpf} disabled />
                          </label>

                          <label className="field field--full">
                            <span>Contato</span>
                            <input
                              name="numeroContato"
                              type="text"
                              placeholder="Telefone, celular ou e-mail alternativo"
                              defaultValue={externalUser.numeroTelefone ?? ""}
                              required
                            />
                          </label>
                        </>
                      ) : internalUser ? (
                        <>
                          <label className="field field--full">
                            <span>Nome do participante</span>
                            <input type="text" value={internalUser.nomeUsuario} disabled />
                          </label>

                          <label className="field">
                            <span>Matrícula</span>
                            <input type="text" value={internalUser.matricula} disabled />
                          </label>

                          <label className="field">
                            <span>Setor</span>
                            <input name="nomeSetor" type="text" placeholder="Informe o setor" required />
                          </label>

                          <label className="field field--full">
                            <span>Contato</span>
                            <input name="numeroContato" type="text" placeholder="Telefone, ramal ou e-mail" required />
                          </label>
                        </>
                      ) : (
                        <>
                          <label className="field field--full">
                            <span>Nome do participante</span>
                            <input name="nomeUsuario" type="text" placeholder="Ex.: João Pereira" required />
                          </label>

                          <label className="field">
                            <span>Matrícula</span>
                            <input name="matricula" type="text" placeholder="Informe a matrícula" required />
                          </label>

                          <label className="field">
                            <span>Setor</span>
                            <input name="nomeSetor" type="text" placeholder="Informe o setor" required />
                          </label>

                          <label className="field field--full">
                            <span>Contato</span>
                            <input name="numeroContato" type="text" placeholder="Telefone, ramal ou e-mail" required />
                          </label>
                        </>
                      )}

                      <div className="form-actions field field--full">
                        <button className="button button--secondary" type="button" onClick={closeEnrollmentModal}>
                          Cancelar
                        </button>
                        <button className="button button--primary" type="submit" disabled={submitting || !canCurrentUserEnroll}>
                          {submitting ? "Confirmando..." : "Confirmar inscrição"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}