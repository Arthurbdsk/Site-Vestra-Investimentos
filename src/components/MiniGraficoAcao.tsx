"use client";

import { useEffect, useState } from "react";
import { Sparkline } from "./Sparkline";

/** Busca o histórico de 1 mês de um ticker e desenha um sparkline. */
export function MiniGraficoAcao({ ticker }: { ticker: string }) {
  const [pontos, setPontos] = useState<number[] | null>(null);

  useEffect(() => {
    let cancelado = false;
    setPontos(null);
    fetch(`/api/historico?ticker=${encodeURIComponent(ticker)}&periodo=1mo`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelado || !json.ok || !Array.isArray(json.serie)) return;
        const precos = json.serie.map((p: { preco: number }) => p.preco);
        if (precos.length > 1) setPontos(precos);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [ticker]);

  if (!pontos) {
    return <div className="h-8 w-24" aria-hidden="true" />;
  }

  return (
    <Sparkline
      points={pontos}
      positive={pontos[pontos.length - 1] >= pontos[0]}
    />
  );
}
