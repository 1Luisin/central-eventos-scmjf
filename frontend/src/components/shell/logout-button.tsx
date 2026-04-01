"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

import { clearLoginSession } from "@/lib/auth/session";

export function LogoutButton() {
  const router = useRouter();

  function handleClick() {
    clearLoginSession();

    startTransition(() => {
      router.push("/login");
    });
  }

  return (
    <button className="button button--secondary topbar__logout" type="button" onClick={handleClick}>
      Logoff
    </button>
  );
}
