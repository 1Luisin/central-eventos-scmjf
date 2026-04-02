import Link from "next/link";

import type { SessionUserContext } from "@/lib/auth/session";

type AppNavigationProps = {
  activeRoute: "dashboard" | "cadastros" | "inscricoes" | "minhas-inscricoes";
  sessionContext: SessionUserContext | null;
};

const navigation = [
  { href: "/dashboard", key: "dashboard", label: "Todos os Eventos", adminOnly: false },
  { href: "/cadastros", key: "cadastros", label: "Cadastros", adminOnly: true },
  { href: "/inscricoes", key: "inscricoes", label: "Nova inscrição", adminOnly: false },
  { href: "/minhas-inscricoes", key: "minhas-inscricoes", label: "Minhas inscrições", adminOnly: false }
] as const;

export function AppNavigation({ activeRoute, sessionContext }: AppNavigationProps) {
  const availableItems = navigation.filter((item) => !item.adminOnly || sessionContext?.isInternalAdmin);

  return (
    <nav className="nav-card" aria-label="Menu principal">
      {availableItems.map((item) => (
        <Link
          key={item.href}
          className={item.key === activeRoute ? "nav-link nav-link--active" : "nav-link"}
          href={item.href}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
