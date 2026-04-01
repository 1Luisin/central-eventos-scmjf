"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import backgroundImage from "../../../imgs/background-page.jpg";
import brandIcon from "../../../imgs/logo-santa-casa.png";
import brandLogo from "../../../imgs/logo-santa-casa2.png";
import { registerExternalUser } from "@/lib/external-users";
import styles from "./external-registration-page-client.module.css";

type FormState = {
  nmCompleto: string;
  nrCpf: string;
  dsEmail: string;
  dsSenha: string;
  confirmarSenha: string;
  nrTelefone: string;
  dtNascimento: string;
  flAceiteLgpd: boolean;
};

const INITIAL_FORM: FormState = {
  nmCompleto: "",
  nrCpf: "",
  dsEmail: "",
  dsSenha: "",
  confirmarSenha: "",
  nrTelefone: "",
  dtNascimento: "",
  flAceiteLgpd: false
};

export function ExternalRegistrationPageClient() {
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

    if (form.dsSenha !== form.confirmarSenha) {
      setFeedback("A confirmação de senha precisa ser igual à senha informada.");
      return;
    }

    try {
      setSubmitting(true);
      setFeedback("");

      const createdUser = await registerExternalUser({
        nmCompleto: form.nmCompleto,
        nrCpf: form.nrCpf,
        dsEmail: form.dsEmail,
        dsSenha: form.dsSenha,
        nrTelefone: form.nrTelefone,
        dtNascimento: form.dtNascimento,
        flAceiteLgpd: form.flAceiteLgpd
      });

      startTransition(() => {
        router.push(`/login?accessMode=externo&registered=1&identifier=${encodeURIComponent(createdUser.dsEmail)}`);
      });
    } catch (error) {
      setSubmitting(false);
      setFeedback(error instanceof Error ? error.message : "Não foi possível concluir o cadastro externo.");
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
              <li>Armazenamento da senha em hash nesta etapa de homologação local.</li>
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
              <p>Os dados abaixo serão usados para identificação, contato e autenticação do participante externo.</p>
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
                  value={form.nmCompleto}
                  onChange={(event) => updateField("nmCompleto", event.target.value)}
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
                  value={form.nrCpf}
                  onChange={(event) => updateField("nrCpf", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>E-mail</span>
                <input
                  autoComplete="email"
                  placeholder="nome@instituicao.com.br"
                  required
                  type="email"
                  value={form.dsEmail}
                  onChange={(event) => updateField("dsEmail", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Telefone</span>
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="(32) 99999-9999"
                  required
                  type="tel"
                  value={form.nrTelefone}
                  onChange={(event) => updateField("nrTelefone", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Data de nascimento</span>
                <input
                  autoComplete="bday"
                  required
                  type="date"
                  value={form.dtNascimento}
                  onChange={(event) => updateField("dtNascimento", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Senha</span>
                <input
                  autoComplete="new-password"
                  placeholder="Defina uma senha"
                  required
                  type="password"
                  value={form.dsSenha}
                  onChange={(event) => updateField("dsSenha", event.target.value)}
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
                  checked={form.flAceiteLgpd}
                  required
                  type="checkbox"
                  onChange={(event) => updateField("flAceiteLgpd", event.target.checked)}
                />
                <span>
                  Declaro que li e aceito o tratamento dos meus dados pessoais para cadastro e acesso ao sistema.
                </span>
              </label>
            </div>

            <div className={styles.systemNote}>
              <strong>Observação importante:</strong> os campos <code>FL_ATIVO</code>, <code>DT_CADASTRO</code>,{" "}
              <code>DT_ULTIMA_ATUALIZACAO</code> e <code>DT_ULTIMO_ACESSO</code> são controlados automaticamente pelo
              sistema nesta etapa.
            </div>

            <p className={styles.feedback} aria-live="polite">
              {feedback}
            </p>

            <div className={styles.actions}>
              <Link className={styles.secondaryAction} href="/login?accessMode=externo">
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
