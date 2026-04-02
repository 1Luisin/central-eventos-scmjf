"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

import { requestVoid } from "@/lib/api/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleClick() {
    try {
      await requestVoid("/api/auth/logout", {
        method: "POST"
      });
    } catch {
      // Intencionalmente silencioso: o retorno para o login deve acontecer mesmo se a limpeza falhar.
    }

    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button className="button button--secondary topbar__logout" type="button" onClick={handleClick}>
      Logoff
    </button>
  );
}
