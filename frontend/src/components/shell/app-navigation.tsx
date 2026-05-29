import Link from "next/link";

import type { SessionUserContext } from "@/lib/auth/session";

export type AppRouteKey = "dashboard" | "cadastros" | "gestao-eventos" | "inscricoes" | "minhas-inscricoes";

type AppNavigationProps = {
  activeRoute: AppRouteKey;
  sessionContext: SessionUserContext | null;
};

const mainNavigation = [
  { href: "/dashboard", key: "dashboard", label: "Eventos", adminOnly: false }
] as const;

const participantNavigation = [
  { href: "/inscricoes", key: "inscricoes", label: "Área de Inscrição", adminOnly: false },
  { href: "/minhas-inscricoes", key: "minhas-inscricoes", label: "Minhas inscrições", adminOnly: false }
] as const;

const adminNavigation = [
  { href: "/cadastros", key: "cadastros", label: "Cadastrar eventos" },
  { href: "/gestao-eventos", key: "gestao-eventos", label: "Gerenciar eventos" }
] as const;

export function AppNavigation({ activeRoute, sessionContext }: AppNavigationProps) {
  const availableItems = mainNavigation.filter((item) => !item.adminOnly || sessionContext?.isInternalAdmin);
  const availableParticipantItems = participantNavigation.filter((item) => !item.adminOnly || sessionContext?.isInternalAdmin);

  return (
    <nav className="nav-card" aria-label="Menu principal">
      <div className="nav-section">
        {availableItems.map((item) => (
          <Link
            key={item.href}
            className={item.key === activeRoute ? "nav-link nav-link--active" : "nav-link"}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="nav-section">
        {availableParticipantItems.map((item) => (
          <Link
            key={item.href}
            className={item.key === activeRoute ? "nav-link nav-link--active" : "nav-link"}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {sessionContext?.isInternalAdmin ? (
        <div className="nav-section nav-section--admin">
          <span className="nav-section__title">Área administrativa</span>

          {adminNavigation.map((item) => (
            <Link
              key={item.href}
              className={item.key === activeRoute ? "nav-link nav-link--active" : "nav-link"}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </nav>
  );
}
