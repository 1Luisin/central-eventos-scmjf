"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import backgroundImage from "../../../imgs/background-page.jpg";
import brandIcon from "../../../imgs/logo-santa-casa.png";
import brandLogo from "../../../imgs/logo-santa-casa2.png";
import { getRequestErrorMessage, requestJson } from "@/lib/api/client";
import type {
  ExternalUserPasswordRecoveryValidationResponse,
  ExternalUserPasswordResetPayload,
  MessageResponse
} from "@/types/api";
import styles from "./password-recovery-page-client.module.css";

type PasswordResetPageClientProps = {
  initialToken?: string;
  initialRedirectPath?: string;
};

type FeedbackTone = "idle" | "success" | "error";

export function PasswordResetPageClient({
  initialToken = "",
  initialRedirectPath = ""
}: PasswordResetPageClientProps) {
  const router = useRouter();
  const [token] = useState(initialToken.trim());
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("idle");
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validacao, setValidacao] = useState<ExternalUserPasswordRecoveryValidationResponse | null>(null);

  const loginHref = useMemo(() => buildLoginHref(initialRedirectPath), [initialRedirectPath]);

  useEffect(() => {
    let active = true;

    async function validateToken() {
      if (!token) {
        if (active) {
          setValidacao({
            valido: false,
            emailMascarado: null,
            expiracaoEm: null,
            mensagem: "O link de redefinição está incompleto. Solicite uma nova recuperação de senha."
          });
          setValidating(false);
        }
        return;
      }

      try {
        const response = await requestJson<ExternalUserPasswordRecoveryValidationResponse>(
          "/api/usuarios-externos/recuperacao-senha/validar",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ token })
          }
        );

        if (active) {
          setValidacao(response);
        }
      } catch (error) {
        if (active) {
          setValidacao({
            valido: false,
            emailMascarado: null,
            expiracaoEm: null,
            mensagem: getRequestErrorMessage(error)
          });
        }
      } finally {
        if (active) {
          setValidating(false);
        }
      }
    }

    void validateToken();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validacao?.valido) {
      setFeedback("Solicite uma nova recuperação de senha para continuar.");
      setFeedbackTone("error");
      return;
    }

    if (novaSenha !== confirmacaoSenha) {
      setFeedback("A confirmação da nova senha deve ser igual à senha informada.");
      setFeedbackTone("error");
      return;
    }

    const payload: ExternalUserPasswordResetPayload = {
      token,
      codigo: codigo.trim(),
      novaSenha,
      confirmacaoNovaSenha: confirmacaoSenha
    };

    try {
      setSubmitting(true);
      setFeedback("");

      const response = await requestJson<MessageResponse>("/api/usuarios-externos/recuperacao-senha/redefinir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      setFeedback(response.mensagem);
      setFeedbackTone("success");

      startTransition(() => {
        router.push(buildPostResetLoginHref(initialRedirectPath));
      });
    } catch (error) {
      setFeedback(getRequestErrorMessage(error));
      setFeedbackTone("error");
      setSubmitting(false);
    }
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
            Recuperação de acesso
          </div>

          <h1>Redefina sua senha</h1>
          <p>Use o código recebido por e-mail para concluir a redefinição do seu acesso externo.</p>

          <ul className={styles.heroList}>
            <li>O link recebido é individual e possui prazo limitado de utilização.</li>
            <li>Informe o código de seis dígitos enviado para o seu e-mail.</li>
            <li>Cadastre uma nova senha e volte ao login para continuar usando o sistema.</li>
          </ul>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.logoWrap}>
              <Image alt="Santa Casa de Misericórdia" className={styles.logo} priority src={brandLogo} />
            </div>

            <div>
              <span className={styles.eyebrow}>Nova senha</span>
              <h2>Concluir redefinição</h2>
              <p>Valide o código recebido e informe a nova senha do seu acesso externo.</p>
            </div>
          </div>

          <div
            className={
              validating
                ? styles.statusBox
                : validacao?.valido
                  ? `${styles.statusBox} ${styles.statusBoxSuccess}`
                  : `${styles.statusBox} ${styles.statusBoxError}`
            }
          >
            <strong>
              {validating ? "Validando link..." : validacao?.valido ? "Link confirmado" : "Link indisponível"}
            </strong>
            <p>{validacao?.mensagem ?? "Aguarde enquanto validamos o link recebido."}</p>
            {!validating && validacao?.emailMascarado ? (
              <span className={styles.statusMeta}>
                E-mail vinculado: {validacao.emailMascarado}
                {validacao.expiracaoEm ? ` • Expira em ${formatDateTime(validacao.expiracaoEm)}` : ""}
              </span>
            ) : null}
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Código de verificação</span>
              <input
                autoComplete="one-time-code"
                disabled={validating || !validacao?.valido || submitting}
                inputMode="numeric"
                maxLength={6}
                placeholder="Digite o código de 6 dígitos"
                type="text"
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>Nova senha</span>
              <input
                autoComplete="new-password"
                disabled={validating || !validacao?.valido || submitting}
                placeholder="Defina uma nova senha"
                type="password"
                value={novaSenha}
                onChange={(event) => setNovaSenha(event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>Confirmar nova senha</span>
              <input
                autoComplete="new-password"
                disabled={validating || !validacao?.valido || submitting}
                placeholder="Repita a nova senha"
                type="password"
                value={confirmacaoSenha}
                onChange={(event) => setConfirmacaoSenha(event.target.value)}
              />
            </label>

            <p className={styles.helper}>
              A nova senha deve ser guardada apenas por você. Após concluir a redefinição, entre novamente pelo login externo.
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
              <button
                className={styles.submit}
                disabled={validating || !validacao?.valido || submitting}
                type="submit"
              >
                {submitting ? "Concluindo..." : "Redefinir senha"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function buildLoginHref(redirectPath: string): string {
  const params = new URLSearchParams();
  params.set("accessMode", "externo");

  if (redirectPath.startsWith("/") && !redirectPath.startsWith("//") && redirectPath !== "/dashboard") {
    params.set("redirect", redirectPath);
  }

  return `/login?${params.toString()}`;
}

function buildPostResetLoginHref(redirectPath: string): string {
  const params = new URLSearchParams();
  params.set("accessMode", "externo");
  params.set("passwordReset", "1");

  if (redirectPath.startsWith("/") && !redirectPath.startsWith("//") && redirectPath !== "/dashboard") {
    params.set("redirect", redirectPath);
  }

  return `/login?${params.toString()}`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
