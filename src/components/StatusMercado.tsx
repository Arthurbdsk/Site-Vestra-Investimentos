"use client";

import { useEffect, useState } from "react";
import { statusMercado } from "@/lib/mercadoStatus";

export function StatusMercado() {
  const [status, setStatus] = useState(() => statusMercado(new Date()));

  useEffect(() => {
    const id = setInterval(() => setStatus(statusMercado(new Date())), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="flex items-center gap-1.5 font-mono text-[11px] text-onblue-muted">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          status.aberto ? "animate-blink bg-emerald-400" : "bg-onblue-muted/60"
        }`}
      />
      {status.mensagem}
    </span>
  );
}
