import type { ReactNode } from "react";
import Link from "next/link";

type AdminAccessGateProps = {
  isAllowed: boolean;
  children: ReactNode;
};

export function AdminAccessGate({ isAllowed, children }: AdminAccessGateProps) {
  if (!isAllowed) {
    return (
      <section className="panel empty-panel">
        <span className="empty-panel__badge">Acesso restrito</span>
        <h3>Esta área está disponível apenas para usuários com permissão de gestão.</h3>
        <p>Se você precisa cadastrar eventos ou categorias, entre em contato com a equipe responsável.</p>
        <div className="card-actions">
          <Link className="button button--secondary" href="/dashboard">
            Voltar para eventos
          </Link>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
