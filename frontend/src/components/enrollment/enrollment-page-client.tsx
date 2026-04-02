"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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
import type { EnrollmentData, InscricaoCreatePayload, InscricaoResponse } from "@/types/api";

type EnrollmentPageClientProps = {
  initialData: EnrollmentData;
  sessionContext: SessionUserContext;
};

type EnrollmentSuccessState = {
  inscricao: InscricaoResponse;
  categoriaNome: string;
  eventoNome: string;
};

export function EnrollmentPageClient({ initialData, sessionContext }: EnrollmentPageClientProps) {
  const searchParams = useSearchParams();
  const queryCategoryId = searchParams.get("categoriaId");
  const queryEventId = searchParams.get("eventoId");

  const [data, setData] = useState(initialData);
  const [selectedCategoryId, setSelectedCategoryId] = useState(queryCategoryId || "");
  const [search, setSearch] = useState("");
  const [pageFeedback, setPageFeedback] = useState<string | null>(initialData.erroInicial ?? null);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<EnrollmentSuccessState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (queryCategoryId && data.categorias.some((categoria) => String(categoria.id) === queryCategoryId)) {
      setSelectedCategoryId(queryCategoryId);
      return;
    }

    if (queryEventId) {
      const firstCategoryForEvent = data.categorias.find((categoria) => String(categoria.eventoId) === queryEventId);
      if (firstCategoryForEvent) {
        setSelectedCategoryId(String(firstCategoryForEvent.id));
        return;
      }
    }

    if (!selectedCategoryId && data.categorias[0]) {
      const preferredCategory = data.categorias.find((categoria) => categoria.permiteInscricao) ?? data.categorias[0];
      setSelectedCategoryId(String(preferredCategory.id));
    }
  }, [data.categorias, queryCategoryId, queryEventId, selectedCategoryId]);

  const externalUser = sessionContext.accessMode === "externo" ? sessionContext.externalUser ?? null : null;
  const internalUser = sessionContext.accessMode === "interno" ? sessionContext.internalUser ?? null : null;
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const visibleEvents = data.eventos
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

  const selectedCategory = data.categorias.find((categoria) => String(categoria.id) === selectedCategoryId) ?? null;
  const categoriaPermiteExterno = selectedCategory?.externo === "S";
  const canCurrentUserEnroll = (selectedCategory?.permiteInscricao ?? false) && (!externalUser || categoriaPermiteExterno);
  const selectedCategoryStatusLabel = selectedCategory
    ? externalUser && !categoriaPermiteExterno
      ? "Somente público interno"
      : selectedCategory.statusLabel
    : "";
  const selectedCategoryStatusDescription = selectedCategory
    ? externalUser && !categoriaPermiteExterno
      ? "Esta categoria aceita apenas participantes internos. Escolha uma categoria com acesso externo liberado para continuar."
      : selectedCategory.statusDescription
    : "";

  async function refreshData() {
    try {
      setRefreshing(true);
      const payload = await requestJson<EnrollmentData>("/api/portal/enrollment");
      setData(payload);
      setPageFeedback(payload.erroInicial ?? null);

      if (selectedCategoryId && payload.categorias.some((categoria) => String(categoria.id) === selectedCategoryId)) {
        return;
      }

      const fallbackCategory = payload.categorias.find((categoria) => categoria.permiteInscricao) ?? payload.categorias[0];
      setSelectedCategoryId(String(fallbackCategory?.id ?? ""));
    } catch (error) {
      setPageFeedback(getRequestErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }

  async function handleEnrollmentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCategory) {
      setFormFeedback("Selecione uma categoria para continuar.");
      setSuccessNotice(null);
      return;
    }

    if (!selectedCategory.permiteInscricao) {
      setFormFeedback(selectedCategory.statusDescription);
      setSuccessNotice(null);
      return;
    }

    if (externalUser && selectedCategory.externo !== "S") {
      setFormFeedback("Esta categoria aceita apenas participantes internos.");
      setSuccessNotice(null);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload: InscricaoCreatePayload = externalUser
      ? {
          eventoId: selectedCategory.eventoId,
          categoriaId: selectedCategory.id,
          idUsuarioExterno: externalUser.idUsuarioExterno,
          numeroContato: normalizeText(formData.get("numeroContato")),
          nomeSetor: "Público externo"
        }
      : internalUser
        ? {
            eventoId: selectedCategory.eventoId,
            categoriaId: selectedCategory.id,
            numeroContato: normalizeText(formData.get("numeroContato")),
            nomeSetor: normalizeText(formData.get("nomeSetor")),
            nomeUsuario: internalUser.nomeUsuario,
            matricula: internalUser.matricula
          }
        : {
            eventoId: selectedCategory.eventoId,
            categoriaId: selectedCategory.id,
            numeroContato: normalizeText(formData.get("numeroContato")),
            nomeSetor: normalizeText(formData.get("nomeSetor")),
            nomeUsuario: normalizeText(formData.get("nomeUsuario")),
            matricula: normalizeText(formData.get("matricula"))
          };

    try {
      setSubmitting(true);
      setFormFeedback(null);
      setSuccessNotice(null);

      const created = await requestJson<InscricaoResponse>("/api/inscricoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      form.reset();
      await refreshData();
      setSuccessNotice({
        inscricao: created,
        categoriaNome: selectedCategory.nomeCategoria,
        eventoNome: selectedCategory.eventoNome
      });
    } catch (error) {
      setFormFeedback(getRequestErrorMessage(error));
      setSuccessNotice(null);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCategorySelect(categoryId: string) {
    setSelectedCategoryId(categoryId);
    setFormFeedback(null);
    setSuccessNotice(null);
  }

  return (
    <div className="registration-layout">
      <section className="stack-xl">
        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Categorias disponíveis</span>
              <h2>Selecione uma categoria</h2>
            </div>

            <div className="toolbar">
              <label className="search-field">
                <span className="search-field__label">Buscar categorias</span>
                <input
                  type="search"
                  placeholder="Procure por evento ou categoria"
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
            A coluna ao lado apresenta o formulário da categoria atualmente selecionada.
          </p>

          {pageFeedback ? <div className="feedback feedback--warning">{pageFeedback}</div> : null}

          <div className="section-meta">
            <span>{formatCountLabel(data.categorias.length, "categoria disponível", "categorias disponíveis")}</span>
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
          visibleEvents.map((evento) => (
            <article className="panel" key={evento.id}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Evento #{evento.id}</span>
                  <h2 className="event-title">{evento.nomeEvento}</h2>
                </div>

                <span className={evento.ativo === "S" ? "badge badge--success" : "badge badge--danger"}>
                  {toTitleCaseFlag(evento.ativo, "Evento ativo", "Evento inativo")}
                </span>
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

              <div className="category-grid">
                {evento.categorias.map((categoria) => (
                  <button
                    key={categoria.id}
                    className={
                      String(categoria.id) === selectedCategoryId
                        ? "category-card category-card--selectable category-card--selected"
                        : "category-card category-card--selectable"
                    }
                    type="button"
                    onClick={() => handleCategorySelect(String(categoria.id))}
                  >
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
                        {formatBooleanFlag(categoria.externo, "Aceita público externo", "Somente público interno")}
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
                  </button>
                ))}
              </div>
            </article>
          ))
        )}
      </section>

      <aside className="panel sticky-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Formulário de inscrição</span>
            <h2>Categoria selecionada</h2>
          </div>
        </div>

        {selectedCategory ? (
          <>
            <div className="selection-card">
              <span className="badge badge--ghost">Seleção atual</span>
              <span className="badge badge--ghost">{selectedCategory.eventoNome}</span>
              <h3>{selectedCategory.nomeCategoria}</h3>
              <p>{selectedCategory.descricao || "Categoria sem descrição complementar."}</p>

              <div className="badge-row">
                <span className={canCurrentUserEnroll ? "badge badge--success" : "badge badge--danger"}>
                  {selectedCategoryStatusLabel}
                </span>
                <span className="badge badge--ghost">
                  {formatBooleanFlag(selectedCategory.externo, "Inscrição externa permitida", "Somente público interno")}
                </span>
              </div>

              <div className="selection-card__meta">
                <span>
                  Período: {formatDateTime(selectedCategory.eventoInicio)} até {formatDateTime(selectedCategory.eventoFim)}
                </span>
                <span>{formatCountLabel(selectedCategory.vagasDisponiveis, "vaga disponível", "vagas disponíveis")}</span>
              </div>

              <p className="category-card__footnote">{selectedCategoryStatusDescription}</p>
            </div>

            {externalUser ? (
              <div className="selection-card">
                <span className="badge badge--ghost">Participante identificado</span>
                <h3>{externalUser.nomeCompleto}</h3>
                <div className="selection-card__meta">
                  <span>E-mail: {externalUser.email}</span>
                  <span>CPF: {externalUser.cpf}</span>
                  <span>Usuário externo</span>
                </div>
              </div>
            ) : internalUser ? (
              <div className="selection-card">
                <span className="badge badge--ghost">Participante identificado</span>
                <h3>{internalUser.nomeUsuario}</h3>
                <div className="selection-card__meta">
                  <span>Matrícula: {internalUser.matricula}</span>
                  <span>E-mail: {internalUser.email || "Não informado"}</span>
                  <span>Usuário interno</span>
                </div>
              </div>
            ) : null}

            {successNotice ? (
              <div className="confirmation-card">
                <div className="confirmation-card__header">
                  <div>
                    <span className="eyebrow">Inscrição confirmada</span>
                    <h3>Vaga reservada com sucesso</h3>
                  </div>
                  <span className="badge badge--success">Inscrito</span>
                </div>

                <p>
                  A inscrição foi registrada na categoria <strong>{successNotice.categoriaNome}</strong>, do evento{" "}
                  <strong>{successNotice.eventoNome}</strong>.
                </p>

                <div className="confirmation-card__grid">
                  <div className="confirmation-card__item">
                    <span>Participante</span>
                    <strong>{successNotice.inscricao.nomeUsuario}</strong>
                  </div>
                  <div className="confirmation-card__item">
                    <span>{successNotice.inscricao.tipoParticipante === "EXTERNO" ? "CPF" : "Matrícula"}</span>
                    <strong>{successNotice.inscricao.matricula}</strong>
                  </div>
                  <div className="confirmation-card__item">
                    <span>{successNotice.inscricao.tipoParticipante === "EXTERNO" ? "Usuário" : "Setor"}</span>
                    <strong>
                      {successNotice.inscricao.tipoParticipante === "EXTERNO"
                        ? "Usuário externo"
                        : successNotice.inscricao.nomeSetor}
                    </strong>
                  </div>
                  <div className="confirmation-card__item">
                    <span>Contato</span>
                    <strong>{successNotice.inscricao.numeroContato}</strong>
                  </div>
                </div>

                <div className="confirmation-card__meta">
                  <span>Registro realizado em {formatDateTime(successNotice.inscricao.dataHoraRegistro)}</span>
                  <span>As vagas da categoria já foram atualizadas na listagem ao lado.</span>
                </div>
              </div>
            ) : null}

            {formFeedback ? <div className="feedback feedback--warning">{formFeedback}</div> : null}

            <form className="form-grid" onSubmit={handleEnrollmentSubmit}>
              {externalUser ? (
                <>
                  <label className="field field--full">
                    <span>NOME DO PARTICIPANTE</span>
                    <input type="text" value={externalUser.nomeCompleto} disabled />
                  </label>

                  <label className="field field--full">
                    <span>CPF</span>
                    <input type="text" value={externalUser.cpf} disabled />
                  </label>

                  <label className="field field--full">
                    <span>CONTATO</span>
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
                    <span>NOME DO PARTICIPANTE</span>
                    <input type="text" value={internalUser.nomeUsuario} disabled />
                  </label>

                  <label className="field">
                    <span>MATRÍCULA</span>
                    <input type="text" value={internalUser.matricula} disabled />
                  </label>

                  <label className="field">
                    <span>SETOR</span>
                    <input name="nomeSetor" type="text" placeholder="Informe o setor" required />
                  </label>

                  <label className="field field--full">
                    <span>CONTATO</span>
                    <input name="numeroContato" type="text" placeholder="Telefone, ramal ou e-mail" required />
                  </label>
                </>
              ) : (
                <>
                  <label className="field field--full">
                    <span>NOME DO PARTICIPANTE</span>
                    <input name="nomeUsuario" type="text" placeholder="Ex.: João Pereira" required />
                  </label>

                  <label className="field">
                    <span>MATRÍCULA</span>
                    <input name="matricula" type="text" placeholder="Informe a matrícula" required />
                  </label>

                  <label className="field">
                    <span>SETOR</span>
                    <input name="nomeSetor" type="text" placeholder="Informe o setor" required />
                  </label>

                  <label className="field field--full">
                    <span>CONTATO</span>
                    <input name="numeroContato" type="text" placeholder="Telefone, ramal ou e-mail" required />
                  </label>
                </>
              )}

              <div className="form-actions field field--full">
                <button className="button button--primary" type="submit" disabled={submitting || !canCurrentUserEnroll}>
                  {submitting ? "Confirmando..." : "Confirmar inscrição"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="inline-empty">
            Selecione uma categoria na coluna ao lado para liberar o formulário de inscrição.
          </div>
        )}
      </aside>
    </div>
  );
}
