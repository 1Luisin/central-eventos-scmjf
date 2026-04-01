"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { getRequestErrorMessage, requestJson } from "@/lib/api/client";
import {
  formatBooleanFlag,
  formatDateTime,
  normalizeText,
  toTitleCaseFlag
} from "@/lib/formatters";
import type { EnrollmentData, InscricaoCreatePayload } from "@/types/api";

type EnrollmentPageClientProps = {
  initialData: EnrollmentData;
};

export function EnrollmentPageClient({ initialData }: EnrollmentPageClientProps) {
  const searchParams = useSearchParams();
  const queryCategoryId = searchParams.get("categoriaId");
  const queryEventId = searchParams.get("eventoId");

  const [data, setData] = useState(initialData);
  const [selectedCategoryId, setSelectedCategoryId] = useState(queryCategoryId || "");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(initialData.erroInicial ?? null);
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

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const visibleEvents = data.eventos
    .map((evento) => ({
      ...evento,
      categorias: evento.categorias.filter((categoria) => {
        if (!normalizedSearch) {
          return true;
        }

        const haystack = [
          evento.nomeEvento,
          categoria.nomeCategoria,
          categoria.descricao ?? "",
          categoria.statusLabel
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      })
    }))
    .filter((evento) => evento.categorias.length > 0);

  const selectedCategory = data.categorias.find((categoria) => String(categoria.id) === selectedCategoryId) ?? null;

  async function refreshData() {
    try {
      setRefreshing(true);
      const payload = await requestJson<EnrollmentData>("/api/portal/enrollment");
      setData(payload);
      setFeedback(payload.erroInicial ?? null);

      if (selectedCategoryId && payload.categorias.some((categoria) => String(categoria.id) === selectedCategoryId)) {
        return;
      }

      const fallbackCategory = payload.categorias.find((categoria) => categoria.permiteInscricao) ?? payload.categorias[0];
      setSelectedCategoryId(String(fallbackCategory?.id ?? ""));
    } catch (error) {
      setFeedback(getRequestErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }

  async function handleEnrollmentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCategory) {
      setFeedback("Selecione uma categoria para continuar.");
      return;
    }

    if (!selectedCategory.permiteInscricao) {
      setFeedback(selectedCategory.statusDescription);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload: InscricaoCreatePayload = {
      eventoId: selectedCategory.eventoId,
      categoriaId: selectedCategory.id,
      numeroContato: normalizeText(formData.get("numeroContato")),
      nomeSetor: normalizeText(formData.get("nomeSetor")),
      nomeUsuario: normalizeText(formData.get("nomeUsuario")),
      matricula: normalizeText(formData.get("matricula"))
    };

    try {
      setSubmitting(true);
      setFeedback(null);

      await requestJson("/api/inscricoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Usuario-Log": payload.matricula
        },
        body: JSON.stringify(payload)
      });

      form.reset();
      setFeedback(`Inscrição realizada com sucesso na categoria "${selectedCategory.nomeCategoria}".`);
      await refreshData();
    } catch (error) {
      setFeedback(getRequestErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="registration-layout">
      <section className="stack-xl">
        <article className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Categorias abertas</span>
              <h2>Selecione uma categoria</h2>
            </div>

            <div className="toolbar">
              <label className="search-field">
                <span className="search-field__label">Filtrar categorias</span>
                <input
                  type="search"
                  placeholder="Procure por evento ou categoria"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <button className="button button--secondary" type="button" onClick={refreshData} disabled={refreshing}>
                {refreshing ? "Atualizando..." : "Atualizar"}
              </button>
            </div>
          </div>

          <p className="section-copy">
            A coluna ao lado mostra o formulário de inscrição da categoria atualmente selecionada.
          </p>

          {feedback ? <div className="feedback feedback--warning">{feedback}</div> : null}

          <div className="section-meta">
            <span>{data.categorias.length} categoria(s) carregada(s)</span>
            <span>Última atualização: {formatDateTime(data.atualizadoEm)}</span>
          </div>
        </article>

        {visibleEvents.length === 0 ? (
          <article className="panel empty-panel">
            <span className="empty-panel__badge">Nenhuma categoria encontrada</span>
            <h3>Não existem categorias compatíveis com o filtro atual.</h3>
            <p>Ajuste a busca ou atualize a listagem para consultar novamente a API.</p>
          </article>
        ) : (
          visibleEvents.map((evento) => (
            <article className="panel" key={evento.id}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Evento #{evento.id}</span>
                  <h2>{evento.nomeEvento}</h2>
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
                    onClick={() => setSelectedCategoryId(String(categoria.id))}
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
                          {categoria.inscricoesRealizadas}/{categoria.limiteInscricoes} inscrições
                        </span>
                        <strong>{categoria.vagasDisponiveis} vaga(s) restantes</strong>
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
                <span className={selectedCategory.permiteInscricao ? "badge badge--success" : "badge badge--danger"}>
                  {selectedCategory.statusLabel}
                </span>
                <span className="badge badge--ghost">
                  {formatBooleanFlag(
                    selectedCategory.externo,
                    "Inscrição externa permitida",
                    "Somente público interno"
                  )}
                </span>
              </div>

              <div className="selection-card__meta">
                <span>
                  Período: {formatDateTime(selectedCategory.eventoInicio)} até{" "}
                  {formatDateTime(selectedCategory.eventoFim)}
                </span>
                <span>{selectedCategory.vagasDisponiveis} vaga(s) disponíveis</span>
              </div>

              <p className="category-card__footnote">{selectedCategory.statusDescription}</p>
            </div>

            <form className="form-grid" onSubmit={handleEnrollmentSubmit}>
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

              <div className="form-actions field field--full">
                <button
                  className="button button--primary"
                  type="submit"
                  disabled={submitting || !selectedCategory.permiteInscricao}
                >
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
