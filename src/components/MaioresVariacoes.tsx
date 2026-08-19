"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ativoPorTicker } from "@/lib/ativos";
import { brl, numero } from "@/lib/formato";
import type { Cotacao } from "@/lib/cotacoes";

export function MaioresVariacoes({
  cotacoes,
  aoVerDetalhe,
}: {
  cotacoes: Cotacao[];
  aoVerDetalhe: (ticker: string) => void;
}) {
  const { altas, baixas } = useMemo(() => {
    const ordenadas = [...cotacoes].sort((a, b) => b.variacao - a.variacao);
    return {
      altas: ordenadas.slice(0, 3).filter((c) => c.variacao > 0),
      baixas: ordenadas
        .slice(-3)
        .reverse()
        .filter((c) => c.variacao < 0),
    };
  }, [cotacoes]);

  if (altas.length === 0 && baixas.length === 0) return null;

  return (
    <div className="mb-8 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
      <Grupo titulo="Maiores altas de hoje" itens={altas} aoVerDetalhe={aoVerDetalhe} />
      <Grupo titulo="Maiores baixas de hoje" itens={baixas} aoVerDetalhe={aoVerDetalhe} />
    </div>
  );
}

function Grupo({
  titulo,
  itens,
  aoVerDetalhe,
}: {
  titulo: string;
  itens: Cotacao[];
  aoVerDetalhe: (ticker: string) => void;
}) {
  if (itens.length === 0) return null;

  return (
    <div className="bg-paper p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">{titulo}</p>
      <ul className="mt-3 space-y-2.5">
        {itens.map((c) => {
          const alta = c.variacao > 0;
          return (
            <li key={c.ticker}>
              <button
                onClick={() => aoVerDetalhe(c.ticker)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="flex items-center gap-2">
                  {alta ? (
                    <TrendingUp size={14} className="shrink-0 text-emerald-600" />
                  ) : (
                    <TrendingDown size={14} className="shrink-0 text-rose-600" />
                  )}
                  <span>
                    <span className="font-mono text-sm font-semibold text-ink">{c.ticker}</span>
                    <span className="ml-2 text-xs text-ink-muted">
                      {ativoPorTicker(c.ticker)?.nome}
                    </span>
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-mono text-sm tabular text-ink">{brl(c.preco)}</span>
                  <span
                    className={`block font-mono text-xs tabular ${
                      alta ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {alta ? "▲" : "▼"} {numero(Math.abs(c.variacao))}%
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
