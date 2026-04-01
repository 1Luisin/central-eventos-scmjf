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
  { href: "/dashboard", key: "dashboard", label: "Todos os Eventos" },
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
          <span className="eyebrow">Hospital Santa Casa de Misericórdia</span>
          <strong>Central de Eventos</strong>
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
          <span className="eyebrow">{sidebarEyebrow}</span>
          <h2>{sidebarTitle}</h2>
          {sidebarDescription ? <p>{sidebarDescription}</p> : null}
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
