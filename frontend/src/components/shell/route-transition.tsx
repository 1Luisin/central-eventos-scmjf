"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const LEAVE_DURATION_MS = 170;
const ENTER_DURATION_MS = 240;

type RouteTransitionProps = {
  children: ReactNode;
};

type TransitionPhase = "idle" | "entering" | "leaving";

export function RouteTransition({ children }: RouteTransitionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<TransitionPhase>("entering");
  const timersRef = useRef<number[]>([]);
  const pendingHrefRef = useRef<string | null>(null);
  const routeKey = pathname;

  useEffect(() => {
    setPhase("entering");
    const timer = window.setTimeout(() => {
      setPhase("idle");
    }, ENTER_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [routeKey]);

  useEffect(() => {
    function clearPendingTimers() {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    }

    function handleDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a[href]");

      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }

      const href = link.getAttribute("href");

      if (
        !href ||
        link.target === "_blank" ||
        link.hasAttribute("download") ||
        link.dataset.noTransition === "true" ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      const currentUrl = new URL(window.location.href);
      const destinationUrl = new URL(link.href, currentUrl);
      const nextHref = `${destinationUrl.pathname}${destinationUrl.search}${destinationUrl.hash}`;
      const samePageAnchor =
        destinationUrl.origin === currentUrl.origin &&
        destinationUrl.pathname === currentUrl.pathname &&
        destinationUrl.search === currentUrl.search &&
        destinationUrl.hash !== currentUrl.hash;

      if (
        destinationUrl.origin !== currentUrl.origin ||
        destinationUrl.href === currentUrl.href ||
        samePageAnchor ||
        pendingHrefRef.current === nextHref
      ) {
        return;
      }

      event.preventDefault();
      clearPendingTimers();
      pendingHrefRef.current = nextHref;
      setPhase("leaving");

      const timer = window.setTimeout(() => {
        router.push(nextHref);
      }, LEAVE_DURATION_MS);

      timersRef.current.push(timer);
    }

    document.addEventListener("click", handleDocumentClick);

    return () => {
      clearPendingTimers();
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [router, routeKey]);

  useEffect(() => {
    pendingHrefRef.current = null;
  }, [routeKey]);

  return (
    <>
      <div
        aria-hidden="true"
        className={phase === "leaving" ? "route-transition-overlay route-transition-overlay--visible" : "route-transition-overlay"}
      />
      <div className={`route-transition route-transition--${phase}`}>{children}</div>
    </>
  );
}
