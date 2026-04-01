import type { ReactNode } from "react";
import Image from "next/image";

import logoSantaCasa from "../../../imgs/logo-santa-casa2.png";
import { AppNavigation } from "@/components/shell/app-navigation";
import { LogoutButton } from "@/components/shell/logout-button";

type AppShellProps = {
  activeRoute: "dashboard" | "cadastros" | "inscricoes";
  eyebrow: string;
  title: string;
  description: string;
  sidebarEyebrow: string;
  sidebarTitle: string;
  sidebarDescription: ReactNode;
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
  children
}: AppShellProps) {
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

          <LogoutButton />
        </div>
      </header>

      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand-card">
            <span className="eyebrow">Hospital Santa Casa de Misericórdia</span>
            <strong>Central de Eventos</strong>
          </div>

          <AppNavigation activeRoute={activeRoute} />

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
              <p>{description}</p>
            </div>
          </header>

          <main className="page-content">{children}</main>
        </div>
      </div>
    </>
  );
}
