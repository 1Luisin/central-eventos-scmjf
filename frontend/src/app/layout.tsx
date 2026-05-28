import type { ReactNode } from "react";
import type { Metadata } from "next";

import { RouteTransition } from "@/components/shell/route-transition";
import "react-datepicker/dist/react-datepicker.css";
import "@scmjf/select-component/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Central de Eventos | Santa Casa de Misericórdia",
  description: "Sistema web para gestão de eventos, categorias e inscrições da Santa Casa de Misericórdia.",
  icons: {
    icon: [{ url: "/logo-santa-casa.png", type: "image/png" }],
    shortcut: ["/logo-santa-casa.png"],
    apple: ["/logo-santa-casa.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <RouteTransition>{children}</RouteTransition>
      </body>
    </html>
  );
}
