"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { isAdminSession, readLoginSession } from "@/lib/auth/session";

type AdminAccessGateProps = {
  children: ReactNode;
};

export function AdminAccessGate({ children }: AdminAccessGateProps) {
  const [accessState, setAccessState] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    const session = readLoginSession();
    setAccessState(isAdminSession(session) ? "allowed" : "denied");
  }, []);

  if (accessState === "checking") {
    return (
      <section className="panel empty-panel">
        <span className="empty-panel__badge">Validando acesso</span>
        <h3>Estamos confirmando o seu perfil no sistema.</h3>
        <p>Aguarde um instante para liberar a área administrativa.</p>
      </section>
    );
  }

  if (accessState === "denied") {
    return (
      <section className="panel empty-panel">
        <span className="empty-panel__badge">Acesso restrito</span>
        <h3>Esta área é exclusiva para usuários administradores.</h3>
        <p>Se você precisa cadastrar eventos ou categorias, entre em contato com a TI.</p>
        <div className="card-actions">
          <Link className="button button--secondary" href="/dashboard">
            Voltar ao painel
          </Link>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
