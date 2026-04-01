"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import backgroundImage from "../../../imgs/background-page.jpg";
import brandIcon from "../../../imgs/logo-santa-casa.png";
import brandLogo from "../../../imgs/logo-santa-casa2.png";
import { getRequestErrorMessage, requestJson } from "@/lib/api/client";
import type { ExternalUserRegisterPayload, ExternalUserResponse } from "@/types/api";
import styles from "./external-registration-page-client.module.css";

type FormState = {
  nomeCompleto: string;
  cpf: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  numeroTelefone: string;
  dataNascimento: string;
  aceiteLgpd: boolean;
};

const INITIAL_FORM: FormState = {
  nomeCompleto: "",
  cpf: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  numeroTelefone: "",
  dataNascimento: "",
  aceiteLgpd: false
};

export function ExternalRegistrationPageClient({ initialRedirectPath = "" }: { initialRedirectPath?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField<Key extends keyof FormState>(field: Key, value: FormState[Key]) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.senha !== form.confirmarSenha) {
      setFeedback("A confirmação de senha precisa ser igual à senha informada.");
      return;
    }

    const payload: ExternalUserRegisterPayload = {
      nomeCompleto: form.nomeCompleto.trim(),
      cpf: form.cpf.trim(),
      email: form.email.trim(),
      senha: form.senha.trim(),
      numeroTelefone: form.numeroTelefone.trim() || undefined,
      dataNascimento: form.dataNascimento || undefined,
      aceiteLgpd: form.aceiteLgpd
    };

    try {
      setSubmitting(true);
      setFeedback("");

      const createdUser = await requestJson<ExternalUserResponse>("/api/usuarios-externos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Usuario-Log": payload.email
        },
        body: JSON.stringify(payload)
      });

      startTransition(() => {
        router.push(buildLoginReturnHref(createdUser.email, initialRedirectPath));
      });
    } catch (error) {
      setSubmitting(false);
      setFeedback(getRequestErrorMessage(error));
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
            Cadastro externo
          </div>

          <h1>Registro de participante externo</h1>
          <p>
            Preencha os dados do participante para liberar o acesso externo e permitir futuras inscrições em eventos da
            Santa Casa.
          </p>

          <div className={styles.heroSection}>
            <span className={styles.heroEyebrow}>Campos preenchidos pelo participante</span>
            <ul className={styles.heroList}>
              <li>Nome completo, CPF, e-mail, telefone e data de nascimento.</li>
              <li>Senha de acesso e aceite LGPD para tratamento dos dados.</li>
            </ul>
          </div>

          <div className={styles.heroSection}>
            <span className={styles.heroEyebrow}>Campos controlados automaticamente</span>
            <ul className={styles.heroList}>
              <li>ID do usuário externo.</li>
              <li>Status ativo do cadastro.</li>
              <li>Datas de cadastro, atualização e último acesso.</li>
              <li>Hash seguro da senha gerado e armazenado pela API.</li>
            </ul>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.logoWrap}>
              <Image alt="Santa Casa de Misericórdia" className={styles.logo} priority src={brandLogo} />
            </div>

            <div>
              <span className={styles.eyebrow}>Registro</span>
              <h2>Cadastre seu acesso externo</h2>
              <p>Os dados abaixo serão enviados para a API da Central de Eventos e gravados no Oracle.</p>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span>Nome completo</span>
                <input
                  autoComplete="name"
                  placeholder="Ex.: Maria Eduarda de Souza"
                  required
                  type="text"
                  value={form.nomeCompleto}
                  onChange={(event) => updateField("nomeCompleto", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>CPF</span>
                <input
                  autoComplete="off"
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="000.000.000-00"
                  required
                  type="text"
                  value={form.cpf}
                  onChange={(event) => updateField("cpf", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>E-mail</span>
                <input
                  autoComplete="email"
                  placeholder="nome@email.com"
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Telefone</span>
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="(32) 99999-9999"
                  type="tel"
                  value={form.numeroTelefone}
                  onChange={(event) => updateField("numeroTelefone", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Data de nascimento</span>
                <input
                  autoComplete="bday"
                  type="date"
                  value={form.dataNascimento}
                  onChange={(event) => updateField("dataNascimento", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Senha</span>
                <input
                  autoComplete="new-password"
                  placeholder="Defina uma senha"
                  required
                  type="password"
                  value={form.senha}
                  onChange={(event) => updateField("senha", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Confirmar senha</span>
                <input
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  required
                  type="password"
                  value={form.confirmarSenha}
                  onChange={(event) => updateField("confirmarSenha", event.target.value)}
                />
              </label>

              <label className={`${styles.checkbox} ${styles.fieldFull}`}>
                <input
                  checked={form.aceiteLgpd}
                  required
                  type="checkbox"
                  onChange={(event) => updateField("aceiteLgpd", event.target.checked)}
                />
                <span>
                  Declaro que li e aceito o tratamento dos meus dados pessoais para cadastro e acesso ao sistema.
                </span>
              </label>
            </div>

            <div className={styles.systemNote}>
              <strong>Observação importante:</strong> os campos <code>FL_ATIVO</code>, <code>DT_CADASTRO</code>,{" "}
              <code>DT_ULTIMA_ATUALIZACAO</code> e <code>DT_ULTIMO_ACESSO</code> são controlados pela API.
            </div>

            <p className={styles.feedback} aria-live="polite">
              {feedback}
            </p>

            <div className={styles.actions}>
              <Link className={styles.secondaryAction} href={buildBackToLoginHref(initialRedirectPath)}>
                Voltar ao login
              </Link>
              <button className={styles.submit} disabled={submitting} type="submit">
                {submitting ? "Registrando..." : "Criar cadastro externo"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function buildLoginReturnHref(email: string, redirectPath: string): string {
  const params = new URLSearchParams({
    accessMode: "externo",
    registered: "1",
    identifier: email
  });

  if (redirectPath.startsWith("/") && !redirectPath.startsWith("//")) {
    params.set("redirect", redirectPath);
  }

  return `/login?${params.toString()}`;
}

function buildBackToLoginHref(redirectPath: string): string {
  if (!redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return "/login?accessMode=externo";
  }

  return `/login?accessMode=externo&redirect=${encodeURIComponent(redirectPath)}`;
}
