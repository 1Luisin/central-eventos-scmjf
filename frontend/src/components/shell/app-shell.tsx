import type { ReactNode } from "react";
import Link from "next/link";

type AppShellProps = {
  activeRoute: "dashboard" | "cadastros" | "inscricoes";
  eyebrow: string;
  title: string;
  description: string;
  sidebarEyebrow: string;
  sidebarTitle: string;
  sidebarDescription: string;
  children: ReactNode;
};

const navigation = [
  { href: "/dashboard", key: "dashboard", label: "Eventos" },
  { href: "/cadastros", key: "cadastros", label: "Cadastros" },
  { href: "/inscricoes", key: "inscricoes", label: "Inscrições" }
] as const;

export function AppShell({
  activeRoute,
  eyebrow,
  title,
  description,
  sidebarEyebrow,
  sidebarTitle,
  sidebarDescription,
  children
}: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <span className="eyebrow">{sidebarEyebrow}</span>
          <strong>{sidebarTitle}</strong>
          <p>{sidebarDescription}</p>
        </div>

        <nav className="nav-card" aria-label="Menu principal">
          {navigation.map((item) => (
            <Link
              key={item.href}
              className={item.key === activeRoute ? "nav-link nav-link--active" : "nav-link"}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-note">
          <span className="eyebrow">Ambiente web</span>
          <h2>Frontend oficial</h2>
          <p>
            Esta aplicação usa rotas internas do Next.js para conversar com a API Java e evitar problemas
            de CORS no servidor.
          </p>
        </div>
      </aside>

      <div className="main-panel">
        <header className="page-hero">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
