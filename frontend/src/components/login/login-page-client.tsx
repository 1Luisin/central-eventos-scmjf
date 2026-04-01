"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import backgroundImage from "../../../imgs/background-page.jpg";
import brandIcon from "../../../imgs/logo-santa-casa.png";
import brandLogo from "../../../imgs/logo-santa-casa2.png";
import { authenticateExternalUser } from "@/lib/external-users";
import styles from "./login-page-client.module.css";

type AccessMode = "interno" | "externo";
type FeedbackTone = "error" | "success";

type LoginPageClientProps = {
  initialAccessMode?: AccessMode;
  initialIdentifier?: string;
  initialFeedback?: string;
  initialFeedbackTone?: FeedbackTone;
};

const FOOTER_LINKS = [
  { href: "http://172.18.0.17/xampp/index.php", label: "Portal TI" },
  { href: "http://172.18.0.17/xampp/contacts.php", label: "Contato" },
  { href: "https://intranet.santacasajf.org.br", label: "Intranet" }
] as const;

export function LoginPageClient({
  initialAccessMode = "interno",
  initialIdentifier = "",
  initialFeedback = "",
  initialFeedbackTone = "error"
}: LoginPageClientProps) {
  const router = useRouter();
  const [accessMode, setAccessMode] = useState<AccessMode>(initialAccessMode);
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState(initialFeedback);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>(initialFeedbackTone);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (accessMode === "interno") {
      if (!identifier.trim() && !password.trim()) {
        setFeedback("Digite ao menos um dado para acessar esta versão estática.");
        setFeedbackTone("error");
        return;
      }

      setSubmitting(true);
      setFeedback("");

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "central-eventos-login",
          JSON.stringify({
            accessMode,
            identifier: identifier.trim(),
            loggedAt: new Date().toISOString()
          })
        );
      }

      startTransition(() => {
        router.push("/dashboard");
      });
      return;
    }

    if (!identifier.trim() || !password.trim()) {
      setFeedback("Informe CPF, e-mail ou nome completo e a senha cadastrada.");
      setFeedbackTone("error");
      return;
    }

    try {
      setSubmitting(true);
      setFeedback("");

      const externalUser = await authenticateExternalUser({
        identificacao: identifier,
        senha: password
      });

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "central-eventos-login",
          JSON.stringify({
            accessMode,
            identifier: externalUser.dsEmail,
            externalUserId: externalUser.idUsuarioExterno,
            nomeCompleto: externalUser.nmCompleto,
            loggedAt: new Date().toISOString()
          })
        );
      }

      startTransition(() => {
        router.push("/dashboard");
      });
    } catch (error) {
      setSubmitting(false);
      setFeedback(error instanceof Error ? error.message : "Não foi possível acessar com o cadastro externo.");
      setFeedbackTone("error");
    }
  }

  function handleModeChange(mode: AccessMode) {
    setAccessMode(mode);
    setFeedback("");
    setFeedbackTone("error");
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

          <h1>Central de Eventos</h1>
          <p>
            Acesse o painel institucional para consultar eventos, categorias disponíveis e inscrições da Santa Casa.
          </p>

          <ul className={styles.heroList}>
            <li>Escolha o perfil de acesso como público interno ou externo.</li>
            <li>Usuários externos agora podem criar o próprio cadastro nesta tela de homologação.</li>
            <li>O acesso interno continua simplificado enquanto a autenticação final não é integrada.</li>
          </ul>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.logoWrap}>
              <Image alt="Santa Casa de Misericórdia" className={styles.logo} priority src={brandLogo} />
            </div>

            <div>
              <span className={styles.eyebrow}>Autenticação</span>
              <h2>Acesse o sistema</h2>
              <p>Selecione o tipo de acesso e informe os dados desejados para entrar no painel principal.</p>
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
              <span>{accessMode === "interno" ? "Login" : "Identificação"}</span>
              <input
                autoComplete={accessMode === "interno" ? "username" : "email"}
                type="text"
                placeholder={accessMode === "interno" ? "Matrícula" : "CPF, e-mail ou nome completo"}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>Senha</span>
              <input
                autoComplete="current-password"
                type="password"
                placeholder={accessMode === "interno" ? "Digite qualquer conteúdo" : "Senha cadastrada"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <p className={styles.helper}>
              {accessMode === "interno"
                ? "O acesso interno segue em modo estático para homologação da interface."
                : "No acesso externo, o login usa os dados cadastrados localmente nesta estação."}
            </p>

            {accessMode === "externo" ? (
              <div className={styles.registerBox}>
                <span>Primeiro acesso como participante externo?</span>
                <Link className={styles.registerLink} href="/cadastro-externo">
                  Cadastrar usuário externo
                </Link>
              </div>
            ) : null}

            <p
              className={
                feedbackTone === "success" ? `${styles.feedback} ${styles.feedbackSuccess}` : styles.feedback
              }
              aria-live="polite"
            >
              {feedback}
            </p>

            <button className={styles.submit} disabled={submitting} type="submit">
              {submitting ? (accessMode === "interno" ? "Acessando..." : "Validando acesso...") : "Entrar"}
            </button>
          </form>

          <footer className={styles.footer}>
            {FOOTER_LINKS.map((item) => (
              <a key={item.href} href={item.href} rel="noreferrer" target="_blank">
                {item.label}
              </a>
            ))}
          </footer>
        </section>
      </div>
    </main>
  );
}
