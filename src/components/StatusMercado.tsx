"use client";

import { useEffect, useState } from "react";
import { statusMercado, type Mercado } from "@/lib/mercadoStatus";

export function StatusMercado({ mercado = "br" }: { mercado?: Mercado }) {
  const [status, setStatus] = useState(() => statusMercado(new Date(), mercado));

  useEffect(() => {
    setStatus(statusMercado(new Date(), mercado));
    const id = setInterval(() => setStatus(statusMercado(new Date(), mercado)), 30_000);
    return () => clearInterval(id);
  }, [mercado]);

  return (
    <span className="flex items-center gap-1.5 font-mono text-[11px] text-onblue-muted">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          status.aberto ? "animate-blink bg-emerald-400" : "bg-onblue-muted/60"
        }`}
      />
      <span className="uppercase tracking-wider">{mercado === "br" ? "B3" : "EUA"}</span>
      {status.mensagem}
    </span>
  );
}
