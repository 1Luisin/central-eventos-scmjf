"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import backgroundImage from "../../../imgs/background-page.jpg";
import brandIcon from "../../../imgs/logo-santa-casa.png";
import brandLogo from "../../../imgs/logo-santa-casa2.png";
import { type AccessMode } from "@/lib/auth/session";
import styles from "./password-recovery-page-client.module.css";

type PasswordRecoveryPageClientProps = {
  initialAccessMode?: AccessMode;
  initialIdentifier?: string;
  initialRedirectPath?: string;
};

type FeedbackTone = "idle" | "success" | "error";

export function PasswordRecoveryPageClient({
  initialAccessMode = "interno",
  initialIdentifier = "",
  initialRedirectPath = ""
}: PasswordRecoveryPageClientProps) {
  const [accessMode, setAccessMode] = useState<AccessMode>(initialAccessMode);
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [contact, setContact] = useState("");
  const [document, setDocument] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("idle");

  const loginHref = useMemo(
    () => buildLoginHref(accessMode, identifier, initialRedirectPath),
    [accessMode, identifier, initialRedirectPath]
  );

  function handleModeChange(mode: AccessMode) {
    setAccessMode(mode);
    setFeedback("");
    setFeedbackTone("idle");
    setContact("");
    setDocument("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedIdentifier = identifier.trim();
    const normalizedContact = contact.trim();
    const normalizedDocument = document.trim();

    if (accessMode === "interno") {
      if (!normalizedIdentifier || !normalizedContact) {
        setFeedback("Informe a matrícula e um e-mail para retorno.");
        setFeedbackTone("error");
        return;
      }

      setFeedback(
        `Solicitação registrada para a matrícula ${normalizedIdentifier}. Na próxima etapa, esta tela será integrada ao fluxo institucional de redefinição de senha.`
      );
      setFeedbackTone("success");
      return;
    }

    if (!normalizedIdentifier || !normalizedDocument) {
      setFeedback("Informe o e-mail cadastrado e o CPF para continuar.");
      setFeedbackTone("error");
      return;
    }

    setFeedback(
      `Solicitação registrada para o e-mail ${normalizedIdentifier}. Na próxima etapa, esta tela será integrada ao envio automático das orientações de redefinição.`
    );
    setFeedbackTone("success");
  }

  return (
    <main className={styles.page}>
      <div className={styles.background} aria-hidden="true">
        <Image
          alt=""
          className={styles.backgroundImage}
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          src={backgroundImage}
        />
        <div className={styles.backgroundOverlay} />
      </div>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroMark}>
            <Image alt="" className={styles.heroIcon} src={brandIcon} />
            Santa Casa de Misericórdia
          </div>

          <h1>Recuperação de senha</h1>
          <p>Escolha o tipo de acesso e informe os dados solicitados para iniciar a recuperação do seu acesso.</p>

          <ul className={styles.heroList}>
            <li>Colaboradores internos informam matrícula e e-mail para retorno.</li>
            <li>Participantes externos informam o e-mail cadastrado e o CPF.</li>
            <li>O envio automático será conectado na próxima etapa da integração.</li>
          </ul>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.logoWrap}>
              <Image alt="Santa Casa de Misericórdia" className={styles.logo} priority src={brandLogo} />
            </div>

            <div>
              <span className={styles.eyebrow}>Suporte de acesso</span>
              <h2>Esqueceu a senha?</h2>
              <p>Preencha o formulário abaixo para registrar sua solicitação de recuperação.</p>
            </div>
          </div>

          <div className={styles.segment} aria-label="Tipo de acesso">
            <button
              className={
                accessMode === "interno" ? `${styles.segmentButton} ${styles.segmentButtonActive}` : styles.segmentButton
              }
              type="button"
              onClick={() => handleModeChange("interno")}
            >
              Interno
            </button>
            <button
              className={
                accessMode === "externo" ? `${styles.segmentButton} ${styles.segmentButtonActive}` : styles.segmentButton
              }
              type="button"
              onClick={() => handleModeChange("externo")}
            >
              Externo
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>{accessMode === "interno" ? "Matrícula" : "E-mail cadastrado"}</span>
              <input
                type={accessMode === "interno" ? "text" : "email"}
                placeholder={accessMode === "interno" ? "Digite sua matrícula" : "nome@instituicao.com.br"}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </label>

            {accessMode === "interno" ? (
              <label className={styles.field}>
                <span>E-mail para retorno</span>
                <input
                  type="email"
                  placeholder="Informe um e-mail para contato"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                />
              </label>
            ) : (
              <label className={styles.field}>
                <span>CPF</span>
                <input
                  type="text"
                  placeholder="Digite o CPF cadastrado"
                  value={document}
                  onChange={(event) => setDocument(event.target.value)}
                />
              </label>
            )}

            <p className={styles.helper}>
              {accessMode === "interno"
                ? "A recuperação do acesso interno seguirá o fluxo institucional da Santa Casa."
                : "A recuperação do acesso externo seguirá o cadastro já existente do participante."}
            </p>

            <p
              className={
                feedbackTone === "success"
                  ? `${styles.feedback} ${styles.feedbackSuccess}`
                  : feedbackTone === "error"
                    ? styles.feedback
                    : styles.feedbackEmpty
              }
              aria-live="polite"
            >
              {feedback}
            </p>

            <div className={styles.actions}>
              <Link className={styles.secondaryAction} href={loginHref}>
                Voltar ao login
              </Link>
              <button className={styles.submit} type="submit">
                Solicitar recuperação
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function buildLoginHref(accessMode: AccessMode, identifier: string, redirectPath: string): string {
  const params = new URLSearchParams();
  params.set("accessMode", accessMode);

  if (identifier.trim()) {
    params.set("identifier", identifier.trim());
  }

  if (redirectPath.startsWith("/") && !redirectPath.startsWith("//") && redirectPath !== "/dashboard") {
    params.set("redirect", redirectPath);
  }

  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}
