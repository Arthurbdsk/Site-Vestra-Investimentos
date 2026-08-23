"use client";

import { useMemo } from "react";
import { Coins } from "lucide-react";
import { brl } from "@/lib/formato";
import type { Transacao } from "./PainelSimulador";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function CalendarioDividendos({ transacoes }: { transacoes: Transacao[] }) {
  const grupos = useMemo(() => {
    const dividendos = transacoes.filter((t) => t.tipo === "dividendo");
    // Chave numerica (ano * 12 + mes) pra ordenar de verdade em ordem
    // cronologica. Uma chave em string tipo "2026-10" x "2026-2" ordena
    // errado (comparacao lexicografica, nao numerica), pois "10" < "2"
    // como texto mesmo sendo novembro depois de marco.
    const porMes = new Map<number, { rotulo: string; total: number; itens: Transacao[] }>();

    for (const d of dividendos) {
      const data = new Date(d.criado_em);
      const chave = data.getFullYear() * 12 + data.getMonth();
      const rotulo = `${MESES[data.getMonth()]} de ${data.getFullYear()}`;
      const existente = porMes.get(chave) ?? { rotulo, total: 0, itens: [] };
      existente.total += d.total;
      existente.itens.push(d);
      porMes.set(chave, existente);
    }

    return [...porMes.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, grupo]) => grupo);
  }, [transacoes]);

  if (grupos.length === 0) return null;

  const totalGeral = grupos.reduce((s, g) => s + g.total, 0);

  return (
    <div className="mb-8 border border-[var(--rule)] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          Dividendos recebidos
        </p>
        <p className="font-mono text-sm font-semibold tabular text-emerald-600">
          {brl(totalGeral)}
        </p>
      </div>

      <ul className="mt-4 space-y-4">
        {grupos.map((g) => (
          <li key={g.rotulo}>
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold capitalize text-ink">{g.rotulo}</p>
              <p className="font-mono text-xs tabular text-ink-muted">{brl(g.total)}</p>
            </div>
            <ul className="mt-1.5 space-y-1">
              {g.itens.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 text-xs text-ink-muted">
                  <span className="flex items-center gap-1.5">
                    <Coins size={12} className="shrink-0 text-emerald-600" />
                    {t.ticker}
                  </span>
                  <span className="font-mono tabular">{brl(t.total)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
