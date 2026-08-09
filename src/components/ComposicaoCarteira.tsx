"use client";

import { useMemo } from "react";
import { acaoPorTicker } from "@/lib/acoes";
import { corDoSetor } from "@/lib/coresSetor";
import { brl, numero } from "@/lib/formato";
import type { Posicao } from "./PainelSimulador";
import type { Cotacao } from "@/lib/cotacoes";

const R = 60;
const CIRCUNFERENCIA = 2 * Math.PI * R;

export function ComposicaoCarteira({
  posicoes,
  precoDe,
}: {
  posicoes: Posicao[];
  precoDe: (t: string) => Cotacao | null;
}) {
  const fatias = useMemo(() => {
    const porSetor = new Map<string, number>();
    for (const p of posicoes) {
      const preco = precoDe(p.ticker)?.preco ?? p.preco_medio;
      const valor = p.quantidade * preco;
      const setor = acaoPorTicker(p.ticker)?.setor ?? "Outros";
      porSetor.set(setor, (porSetor.get(setor) ?? 0) + valor);
    }
    const total = [...porSetor.values()].reduce((s, v) => s + v, 0);
    if (total === 0) return [];

    let acumulado = 0;
    return [...porSetor.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([setor, valor]) => {
        const fracao = valor / total;
        const offset = acumulado;
        acumulado += fracao;
        return { setor, valor, fracao, offset, cor: corDoSetor(setor) };
      });
  }, [posicoes, precoDe]);

  const total = fatias.reduce((s, f) => s + f.valor, 0);

  if (fatias.length === 0) return null;

  return (
    <div className="mb-8 border border-[var(--rule)] p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
        Composição por setor
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-8">
        <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0 -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="var(--rule)"
            strokeWidth="18"
          />
          {fatias.map((f) => (
            <circle
              key={f.setor}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={f.cor}
              strokeWidth="18"
              strokeDasharray={`${f.fracao * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
              strokeDashoffset={-f.offset * CIRCUNFERENCIA}
            />
          ))}
        </svg>

        <ul className="min-w-[200px] flex-1 space-y-2">
          {fatias.map((f) => (
            <li key={f.setor} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-ink">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: f.cor }}
                />
                {f.setor}
              </span>
              <span className="font-mono text-xs tabular text-ink-muted">
                {brl(f.valor)} · {numero((f.valor / total) * 100, 1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
