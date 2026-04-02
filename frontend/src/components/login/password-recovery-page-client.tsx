"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import backgroundImage from "../../../imgs/background-page.jpg";
import brandIcon from "../../../imgs/logo-santa-casa.png";
import brandLogo from "../../../imgs/logo-santa-casa2.png";
import styles from "./password-recovery-page-client.module.css";

type PasswordRecoveryPageClientProps = {
  initialIdentifier?: string;
  initialRedirectPath?: string;
};

type FeedbackTone = "idle" | "success" | "error";

export function PasswordRecoveryPageClient({
  initialIdentifier = "",
  initialRedirectPath = ""
}: PasswordRecoveryPageClientProps) {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [document, setDocument] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("idle");

  const loginHref = useMemo(
    () => buildLoginHref(identifier, initialRedirectPath),
    [identifier, initialRedirectPath]
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedIdentifier = identifier.trim();
    const normalizedDocument = document.trim();

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
          <p>Informe seus dados para iniciar a recuperação da senha do seu acesso externo.</p>

          <ul className={styles.heroList}>
            <li>Use o e-mail informado no seu cadastro de participante externo.</li>
            <li>Confirme o CPF cadastrado para validar a solicitação.</li>
            <li>O envio automático da redefinição será conectado na próxima etapa da integração.</li>
          </ul>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.logoWrap}>
              <Image alt="Santa Casa de Misericórdia" className={styles.logo} priority src={brandLogo} />
            </div>

            <div>
              <span className={styles.eyebrow}>Acesso externo</span>
              <h2>Esqueceu a senha?</h2>
              <p>Preencha o formulário abaixo para registrar sua solicitação de recuperação.</p>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>E-mail cadastrado</span>
              <input
                type="email"
                placeholder="nome@instituicao.com.br"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>CPF</span>
              <input
                type="text"
                placeholder="Digite o CPF cadastrado"
                value={document}
                onChange={(event) => setDocument(event.target.value)}
              />
            </label>

            <p className={styles.helper}>
              Esta recuperação é exclusiva para participantes externos cadastrados no sistema.
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

function buildLoginHref(identifier: string, redirectPath: string): string {
  const params = new URLSearchParams();
  params.set("accessMode", "externo");

  if (identifier.trim()) {
    params.set("identifier", identifier.trim());
  }

  if (redirectPath.startsWith("/") && !redirectPath.startsWith("//") && redirectPath !== "/dashboard") {
    params.set("redirect", redirectPath);
  }

  const query = params.toString();
  return query ? `/login?${query}` : "/login?accessMode=externo";
}
