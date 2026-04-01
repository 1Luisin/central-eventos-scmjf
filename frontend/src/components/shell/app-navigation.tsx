"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isAdminSession, readLoginSession, type LoginSession } from "@/lib/auth/session";

type AppNavigationProps = {
  activeRoute: "dashboard" | "cadastros" | "inscricoes";
};

const navigation = [
  { href: "/dashboard", key: "dashboard", label: "Todos os Eventos", adminOnly: false },
  { href: "/cadastros", key: "cadastros", label: "Cadastros", adminOnly: true },
  { href: "/inscricoes", key: "inscricoes", label: "Inscrições", adminOnly: false }
] as const;

export function AppNavigation({ activeRoute }: AppNavigationProps) {
  const [session, setSession] = useState<LoginSession | null>(null);

  useEffect(() => {
    setSession(readLoginSession());
  }, []);

  const availableItems = navigation.filter((item) => !item.adminOnly || isAdminSession(session));

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
