"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import backgroundImage from "../../../imgs/background-page.jpg";
import brandIcon from "../../../imgs/logo-santa-casa.png";
import brandLogo from "../../../imgs/logo-santa-casa2.png";
import styles from "./login-page-client.module.css";

type AccessMode = "interno" | "externo";

const FOOTER_LINKS = [
  { href: "http://172.18.0.17/xampp/index.php", label: "Portal TI" },
  { href: "http://172.18.0.17/xampp/contacts.php", label: "Contato" },
  { href: "https://intranet.santacasajf.org.br", label: "Intranet" }
] as const;

export function LoginPageClient() {
  const router = useRouter();
  const [accessMode, setAccessMode] = useState<AccessMode>("interno");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!identifier.trim() && !password.trim()) {
      setFeedback("Digite ao menos um dado para acessar esta versão estática.");
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
            <li>Entrada simplificada para validação da interface e do fluxo principal.</li>
            <li>Escolha o perfil de acesso como público interno ou externo.</li>
            <li>Qualquer informação digitada libera o acesso nesta etapa estática.</li>
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
              className={accessMode === "interno" ? `${styles.segmentButton} ${styles.segmentButtonActive}` : styles.segmentButton}
              type="button"
              onClick={() => setAccessMode("interno")}
            >
              Interno
            </button>
            <button
              className={accessMode === "externo" ? `${styles.segmentButton} ${styles.segmentButtonActive}` : styles.segmentButton}
              type="button"
              onClick={() => setAccessMode("externo")}
            >
              Externo
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>{accessMode === "interno" ? "Login" : "Identificação"}</span>
              <input
                type="text"
                placeholder={accessMode === "interno" ? "Matrícula" : "Documento, e-mail ou nome"}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>Senha</span>
              <input
                type="password"
                placeholder="Digite qualquer conteúdo"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <p className={styles.helper}>
              Esta página está em modo estático para homologação. Ainda não há validação real de credenciais.
            </p>

            <p className={styles.feedback} aria-live="polite">
              {feedback}
            </p>

            <button className={styles.submit} disabled={submitting} type="submit">
              {submitting ? "Acessando..." : "Entrar"}
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
