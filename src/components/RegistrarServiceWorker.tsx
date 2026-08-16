"use client";

import { useEffect } from "react";

/** Registra o service worker (PWA) depois que a pagina carrega, sem
 * atrasar o carregamento inicial. */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
