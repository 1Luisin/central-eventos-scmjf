"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import ScmjfSelect from "@scmjf/select-component";

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

type CategoryState = "confirmed" | "full" | "internal-only" | "inactive" | "unavailable" | "available";

export function EnrollmentPageClient({ initialData, sessionContext }: EnrollmentPageClientProps) {
  const searchParams = useSearchParams();
  const queryCategoryId = searchParams.get("categoriaId");
  const queryEventId = searchParams.get("eventoId");

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState(queryCategoryId || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageFeedback, setPageFeedback] = useState<string | null>(initialData.erroInicial ?? null);
  const [pageFeedbackTone, setPageFeedbackTone] = useState<PageFeedbackTone>(initialData.erroInicial ? "warning" : "info");
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [setores, setSetores] = useState<string[]>([]);
  const [setoresFeedback, setSetoresFeedback] = useState<string | null>(null);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [selectedSetor, setSelectedSetor] = useState("");
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

  const visibleCategories = useMemo(() => visibleEvents.flatMap((evento) => evento.categorias), [visibleEvents]);

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
    (!externalUser || categoriaPermiteExterno) &&
    (activeCategory?.vagasDisponiveis ?? 0) > 0 &&
    activeCategory?.ativo === "S";
  const requiresSetorSelection = !externalUser;
  const setorSelectionUnavailable = requiresSetorSelection && (loadingSetores || setores.length === 0);

  const visibleCategoryCount = visibleCategories.length;

  function isCategoryFull(category: CategoriaViewModel) {
    return category.vagasDisponiveis <= 0;
  }

  function getCategoryState(category: CategoriaViewModel): CategoryState {
    if (category.inscricaoAtual) {
      return "confirmed";
    }

    if (isCategoryFull(category)) {
      return "full";
    }

    if (externalUser && category.externo !== "S") {
      return "internal-only";
    }

    if (category.ativo !== "S") {
      return "inactive";
    }

    if (!category.permiteInscricao) {
      return "unavailable";
    }

    return "available";
  }

  function getCategoryFootnote(category: CategoriaViewModel) {
    const state = getCategoryState(category);

    if (state === "confirmed") {
      return "Sua vaga nesta categoria já está confirmada. Não é necessário realizar uma nova inscrição.";
    }

    if (state === "full") {
      return "As vagas desta categoria já foram preenchidas no momento.";
    }

    if (state === "internal-only") {
      return "Esta categoria aceita apenas participantes internos. Escolha outra opção para continuar.";
    }

    return category.statusDescription;
  }

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
    if (!isModalOpen || externalUser || currentEnrollment || modalSuccess || setores.length > 0) {
      return;
    }

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
  }, [isModalOpen, externalUser, currentEnrollment, modalSuccess, setores.length]);

  useEffect(() => {
    if (!queryCategoryId) {
      return;
    }

    const queryCategory = visibleCategories.find((categoria) => String(categoria.id) === queryCategoryId);
    if (!queryCategory) {
      return;
    }

    if (getCategoryState(queryCategory) === "available") {
      setActiveCategoryId(queryCategoryId);
      setModalFeedback(null);
      setModalSuccess(null);
      setIsModalOpen(true);
      return;
    }

    setPageFeedback(`A categoria ${queryCategory.nomeCategoria} não está disponível para inscrição no momento.`);
    setPageFeedbackTone("warning");
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
      setModalSuccess(null);
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
      setModalSuccess(`Sua inscrição em ${activeCategory.nomeCategoria} já está confirmada.`);
      setModalFeedback(null);
      return;
    }

    if (isCategoryFull(activeCategory)) {
      setModalFeedback("Vagas cheias para esta categoria.");
      return;
    }

    if (!activeCategory.permiteInscricao || activeCategory.ativo !== "S") {
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
      setModalSuccess(null);

      await requestJson<InscricaoResponse>("/api/inscricoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      await refreshData();
      setModalSuccess(`Inscrição realizada com sucesso em ${activeCategory.nomeCategoria}.`);
      setPageFeedback(`Inscrição confirmada com sucesso em ${activeCategory.nomeCategoria}.`);
      setPageFeedbackTone("info");
      setModalFeedback(null);
    } catch (error) {
      const errorMessage = getRequestErrorMessage(error);

      if (errorMessage.toLowerCase().includes("já inscrito")) {
        await refreshData();
        setModalSuccess(`Sua inscrição em ${activeCategory.nomeCategoria} já estava confirmada.`);
        setPageFeedback(`Sua inscrição em ${activeCategory.nomeCategoria} já estava confirmada.`);
        setPageFeedbackTone("info");
        setModalFeedback(null);
      } else if (errorMessage.toLowerCase().includes("vaga") || errorMessage.toLowerCase().includes("lotad")) {
        await refreshData();
        setModalFeedback("Vagas cheias para esta categoria.");
        setPageFeedback(`As vagas da categoria ${activeCategory.nomeCategoria} já foram preenchidas.`);
        setPageFeedbackTone("warning");
      } else {
        setModalFeedback(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function openEnrollmentModal(category: CategoriaViewModel) {
    const state = getCategoryState(category);

    if (state === "full") {
      setPageFeedback(`Vagas cheias para a categoria ${category.nomeCategoria}.`);
      setPageFeedbackTone("warning");
      return;
    }

    if (state === "internal-only") {
      setPageFeedback(`A categoria ${category.nomeCategoria} aceita apenas participantes internos.`);
      setPageFeedbackTone("warning");
      return;
    }

    if (state === "inactive" || state === "unavailable") {
      setPageFeedback(`A categoria ${category.nomeCategoria} não está disponível para inscrição no momento.`);
      setPageFeedbackTone("warning");
      return;
    }

    setActiveCategoryId(String(category.id));
    setSelectedSetor("");
    setModalFeedback(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  }

  function closeEnrollmentModal() {
    setIsModalOpen(false);
    setSelectedSetor("");
    setModalFeedback(null);
    setModalSuccess(null);
  }

  function renderCategoryAction(category: CategoriaViewModel) {
    const state = getCategoryState(category);

    if (state === "confirmed") {
      return <span className="button button--secondary button--static">Inscrição confirmada</span>;
    }

    if (state === "full") {
      return <span className="button button--danger button--static">Vagas cheias</span>;
    }

    if (state === "internal-only") {
      return <span className="button button--secondary button--static">Somente interno</span>;
    }

    if (state === "inactive" || state === "unavailable") {
      return <span className="button button--secondary button--static">Indisponível</span>;
    }

    return (
      <button className="button button--primary" type="button" onClick={() => openEnrollmentModal(category)}>
        Realizar inscrição
      </button>
    );
  }

  function renderSetorField() {
    const placeholder = loadingSetores
      ? "Carregando setores..."
      : setores.length === 0
        ? "Nenhum setor disponível"
        : "Selecione o setor";

    return (
      <div className="field">
        <span>Setor</span>
        <ScmjfSelect
          aria-label="Setor"
          name="nomeSetor"
          required
          value={selectedSetor}
          onChange={(event) => setSelectedSetor(event.target.value)}
          disabled={loadingSetores || setores.length === 0}
          placeholder={placeholder}
          searchPlaceholder="Buscar setor..."
          emptyMessage="Nenhum setor encontrado"
        >
          {setores.map((setor) => (
            <option key={setor} value={setor}>
              {setor}
            </option>
          ))}
        </ScmjfSelect>
      </div>
    );
  }

  const participantSummary = externalUser
    ? {
        title: externalUser.nomeCompleto,
        subtitle: `CPF ${externalUser.cpf}`,
        contactLabel: "Contato",
        contactValue: externalUser.numeroTelefone ?? ""
      }
    : internalUser
      ? {
          title: internalUser.nomeUsuario,
          subtitle: `Matrícula ${internalUser.matricula}`,
          contactLabel: "Contato",
          contactValue: ""
        }
      : null;

  return (
    <div className="stack-xl">
      <article className="panel panel--enrollment-board">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Categorias disponíveis</span>
            <h2>{selectedEvent ? "Categorias do evento selecionado" : "Categorias abertas para inscrição"}</h2>
            <div className="section-meta section-meta--enrollment-board">
              <span>{formatCountLabel(visibleCategoryCount, "categoria disponível", "categorias disponíveis")}</span>
              <span>Última atualização: {formatDateTime(data.atualizadoEm)}</span>
            </div>
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

        {pageFeedback ? <div className={`feedback feedback--${pageFeedbackTone}`}>{pageFeedback}</div> : null}
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
                  const categoryState = getCategoryState(categoria);
                  const badgeClass =
                    categoryState === "confirmed" || categoryState === "available"
                      ? "badge badge--success"
                      : "badge badge--danger";

                  return (
                    <section className="category-card" key={categoria.id}>
                      <div className="category-card__top">
                        <div>
                          <h4>{categoria.nomeCategoria}</h4>
                          {categoria.descricao ? <p>{categoria.descricao}</p> : null}
                        </div>
                        <span className={badgeClass}>
                          {categoryState === "confirmed"
                            ? "Inscrição confirmada"
                            : categoryState === "full"
                              ? "Vagas cheias"
                              : categoria.statusLabel}
                        </span>
                      </div>

                      <div className="badge-row">
                        <span className="badge badge--ghost">
                          {formatBooleanFlag(categoria.externo, "Aceita público externo", "Somente público interno")}
                        </span>
                        <span className={categoria.ativo === "S" ? "badge badge--neutral" : "badge badge--danger"}>
                          {toTitleCaseFlag(categoria.ativo, "Categoria ativa", "Categoria inativa")}
                        </span>
                        {categoryState === "confirmed" ? <span className="badge badge--success">Você já está inscrito</span> : null}
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

                      <p className="category-card__footnote">{getCategoryFootnote(categoria)}</p>

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
                    <span className="eyebrow">Inscrição</span>
                    <h3 id="enrollment-modal-title">{activeCategory.nomeCategoria}</h3>
                    <p>{activeCategory.eventoNome}</p>
                  </div>

                  <button className="modal-card__close" type="button" onClick={closeEnrollmentModal} aria-label="Fechar inscrição">
                    Fechar
                  </button>
                </div>

                <div className="modal-card__body">
                  <div className="modal-copy">
                    <p>
                      <strong>Período:</strong> {formatDateTime(activeCategory.eventoInicio)} até {formatDateTime(activeCategory.eventoFim)}
                    </p>
                    <p>
                      <strong>Situação:</strong> {formatCountLabel(activeCategory.vagasDisponiveis, "vaga disponível", "vagas disponíveis")}
                    </p>
                    <p>{activeCategory.descricao || "Confirme os dados abaixo para concluir a inscrição nesta categoria."}</p>
                  </div>

                  {participantSummary ? (
                    <div className="modal-copy modal-copy--participant">
                      <strong>{participantSummary.title}</strong>
                      <span>{participantSummary.subtitle}</span>
                    </div>
                  ) : null}

                  {modalFeedback ? <div className="feedback feedback--warning">{modalFeedback}</div> : null}
                  {!externalUser && setoresFeedback ? <div className="feedback feedback--warning">{setoresFeedback}</div> : null}

                  {modalSuccess ? (
                    <div className="modal-success">
                      <span className="badge badge--success">Inscrição confirmada</span>
                      <h4>Tudo certo</h4>
                      <p>{modalSuccess}</p>
                      <div className="modal-success__actions">
                        <button className="button button--primary" type="button" onClick={closeEnrollmentModal}>
                          Concluir
                        </button>
                      </div>
                    </div>
                  ) : currentEnrollment ? (
                    <div className="modal-success">
                      <span className="badge badge--success">Inscrição confirmada</span>
                      <h4>Você já está inscrito</h4>
                      <p>Sua vaga nesta categoria já está reservada. Não é necessário realizar uma nova inscrição.</p>
                      <div className="modal-success__actions">
                        <button className="button button--primary" type="button" onClick={closeEnrollmentModal}>
                          Fechar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form className="form-grid modal-form" onSubmit={handleEnrollmentSubmit}>
                      {externalUser ? (
                        <label className="field field--full">
                          <span>Contato</span>
                          <input
                            name="numeroContato"
                            type="text"
                            placeholder="Telefone, celular ou e-mail alternativo"
                            defaultValue={participantSummary?.contactValue ?? ""}
                            required
                          />
                        </label>
                      ) : internalUser ? (
                        <>
                          {renderSetorField()}

                          <label className="field">
                            <span>Contato</span>
                            <input
                              name="numeroContato"
                              type="text"
                              placeholder="Telefone, ramal ou e-mail"
                              defaultValue={participantSummary?.contactValue ?? ""}
                              required
                            />
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

                          {renderSetorField()}

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
                        <button
                          className="button button--primary"
                          type="submit"
                          disabled={submitting || !canCurrentUserEnroll || setorSelectionUnavailable}
                        >
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
