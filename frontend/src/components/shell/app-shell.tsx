import type { ReactNode } from "react";
import Image from "next/image";

import logoSantaCasa from "../../../imgs/logo-santa-casa2.png";
import { AppNavigation } from "@/components/shell/app-navigation";
import { LogoutButton } from "@/components/shell/logout-button";
import type { SessionUserContext } from "@/lib/auth/session";

type AppShellProps = {
  activeRoute: "dashboard" | "cadastros" | "inscricoes" | "minhas-inscricoes";
  eyebrow: string;
  title: string;
  description?: string;
  sidebarEyebrow: string;
  sidebarTitle: string;
  sidebarDescription: ReactNode;
  sessionContext: SessionUserContext | null;
  children: ReactNode;
};

export function AppShell({
  activeRoute,
  eyebrow,
  title,
  description,
  sidebarEyebrow,
  sidebarTitle,
  sidebarDescription,
  sessionContext,
  children
}: AppShellProps) {
  const greetingName = formatGreetingName(sessionContext?.displayName ?? "");

  return (
    <>
      <header className="topbar">
        <div className="topbar__inner">
          <div className="topbar__brand">
            <div className="topbar__logo-wrap" aria-hidden="true">
              <Image src={logoSantaCasa} alt="" className="topbar__logo" sizes="160px" priority />
            </div>

            <div className="topbar__copy">
              <span className="eyebrow">Santa Casa de Misericórdia</span>
              <strong>Central de Eventos</strong>
            </div>
          </div>

          <div className="topbar__actions">
            {greetingName ? <span className="topbar__greeting">Olá, {greetingName}!</span> : null}
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="app-shell">
        <aside className="sidebar">
          <AppNavigation activeRoute={activeRoute} sessionContext={sessionContext} />

          <div className="sidebar-note">
            <span className="eyebrow">{sidebarEyebrow}</span>
            <h2>{sidebarTitle}</h2>
            {sidebarDescription ? (
              typeof sidebarDescription === "string" ? (
                <p>{sidebarDescription}</p>
              ) : (
                <div className="sidebar-note__content">{sidebarDescription}</div>
              )
            ) : null}
          </div>
        </aside>

        <div className="main-panel">
          <header className="page-hero">
            <div>
              <span className="eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
              {description ? <p>{description}</p> : null}
            </div>
          </header>

          <main className="page-content">{children}</main>
        </div>
      </div>
    </>
  );
}

function formatGreetingName(fullName: string): string | null {
  const normalizedParts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (normalizedParts.length === 0) {
    return null;
  }

  return normalizedParts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
