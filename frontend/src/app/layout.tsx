import type { ReactNode } from "react";
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Central de Eventos | Santa Casa de Misericórdia",
  description: "Sistema web para gestão de eventos, categorias e inscrições da Santa Casa de Misericórdia."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
