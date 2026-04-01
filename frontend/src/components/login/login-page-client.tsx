"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import backgroundImage from "../../../imgs/background-page.jpg";
import brandIcon from "../../../imgs/logo-santa-casa.png";
import brandLogo from "../../../imgs/logo-santa-casa2.png";
import { saveLoginSession, type AccessMode } from "@/lib/auth/session";
import { getRequestErrorMessage, requestJson } from "@/lib/api/client";
import type {
  ExternalUserLoginPayload,
  ExternalUserResponse,
  InternalUserLoginPayload,
  InternalUserResponse
} from "@/types/api";
import styles from "./login-page-client.module.css";

type FeedbackTone = "error" | "success";

type LoginPageClientProps = {
  initialAccessMode?: AccessMode;
  initialIdentifier?: string;
  initialFeedback?: string;
  initialFeedbackTone?: FeedbackTone;
  initialRedirectPath?: string;
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
  initialFeedbackTone = "error",
  initialRedirectPath = ""
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
      const payload: InternalUserLoginPayload = {
        matricula: identifier.trim().toUpperCase(),
        senha: password.trim()
      };

      if (!payload.matricula || !payload.senha) {
        setFeedback("Informe a matrícula e a senha do MV para continuar.");
        setFeedbackTone("error");
        return;
      }

      try {
        setSubmitting(true);
        setFeedback("");

        const internalUser = await requestJson<InternalUserResponse>("/api/usuarios-internos/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        saveLoginSession({
          accessMode,
          identifier: internalUser.matricula,
          internalUser,
          loggedAt: new Date().toISOString()
        });

        startTransition(() => {
          router.push(resolvePostLoginRoute(initialRedirectPath));
        });
      } catch (error) {
        setSubmitting(false);
        setFeedback(getRequestErrorMessage(error));
        setFeedbackTone("error");
      }
      return;
    }

    const payload: ExternalUserLoginPayload = {
      email: identifier.trim(),
      senha: password.trim()
    };

    if (!payload.email || !payload.senha) {
      setFeedback("Informe o e-mail cadastrado e a senha de acesso.");
      setFeedbackTone("error");
      return;
    }

    try {
      setSubmitting(true);
      setFeedback("");

      const externalUser = await requestJson<ExternalUserResponse>("/api/usuarios-externos/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      saveLoginSession({
        accessMode,
        identifier: externalUser.email,
        externalUser,
        loggedAt: new Date().toISOString()
      });

      startTransition(() => {
        router.push(resolvePostLoginRoute(initialRedirectPath));
      });
    } catch (error) {
      setSubmitting(false);
      setFeedback(getRequestErrorMessage(error));
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
            <li>Usuários externos podem criar o próprio cadastro e entrar com e-mail e senha.</li>
            <li>Usuários internos entram com matrícula e senha do MV, com o papel validado automaticamente.</li>
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
              <span>{accessMode === "interno" ? "Matrícula" : "E-mail"}</span>
              <input
                autoComplete={accessMode === "interno" ? "username" : "email"}
                type={accessMode === "interno" ? "text" : "email"}
                placeholder={accessMode === "interno" ? "Digite a matrícula do MV" : "nome@instituicao.com.br"}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>Senha</span>
              <input
                autoComplete="current-password"
                type="password"
                placeholder={accessMode === "interno" ? "Senha do MV" : "Senha cadastrada"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <p className={styles.helper}>
              {accessMode === "interno"
                ? "O acesso interno valida matrícula, senha e papel do MV. Se você não tiver os papéis corretos, entre em contato com a TI."
                : "No acesso externo, o login já usa a API e valida e-mail, senha e status do cadastro."}
            </p>

            {accessMode === "externo" ? (
              <div className={styles.registerBox}>
                <span>Primeiro acesso como participante externo?</span>
                <Link
                  className={styles.registerLink}
                  href={buildExternalRegistrationHref(initialRedirectPath)}
                >
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
              {submitting ? "Validando acesso..." : "Entrar"}
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

function resolvePostLoginRoute(redirectPath: string): string {
  if (!redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return "/dashboard";
  }

  return redirectPath;
}

function buildExternalRegistrationHref(redirectPath: string): string {
  const normalizedRedirect = resolvePostLoginRoute(redirectPath);
  return normalizedRedirect === "/dashboard"
    ? "/cadastro-externo"
    : `/cadastro-externo?redirect=${encodeURIComponent(normalizedRedirect)}`;
}
