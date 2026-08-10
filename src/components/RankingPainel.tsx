"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { brl, numero } from "@/lib/formato";

export type RankingLinha = {
  apelido: string;
  patrimonio: number;
  posicao: number;
};

export type RankingMensalLinha = {
  apelido: string;
  ganho: number;
  ganhoPct: number;
  posicao: number;
};

const MEDALHAS = [
  { fundo: "#f5d371", texto: "#5c4400" }, // ouro
  { fundo: "#d6d9dc", texto: "#4a4f54" }, // prata
  { fundo: "#dba36a", texto: "#5a3818" }, // bronze
];

function Posicao({ posicao }: { posicao: number }) {
  if (posicao > 3) {
    return <span className="font-mono text-xs tabular text-ink-muted">{posicao}.</span>;
  }
  const m = MEDALHAS[posicao - 1];
  return (
    <span
      className="flex h-5 w-5 items-center justify-center rounded-full"
      style={{ background: m.fundo, color: m.texto }}
    >
      <Trophy size={11} />
    </span>
  );
}

export function RankingPainel({
  ranking,
  rankingMensal,
}: {
  ranking: RankingLinha[];
  rankingMensal: RankingMensalLinha[];
}) {
  const [visao, setVisao] = useState<"geral" | "mes">("geral");

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Ranking de investidores</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        {visao === "geral"
          ? "Os maiores patrimônios fictícios do Vestra, somando caixa, ações (pelo preço que você pagou) e renda fixa investida."
          : "Desafio do mês: quem mais fez o patrimônio crescer desde o início deste mês (não é o total acumulado)."}
      </p>

      <div className="mt-5 flex gap-1.5">
        <button
          onClick={() => setVisao("geral")}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
            visao === "geral" ? "bg-blue text-onblue" : "border border-[var(--rule)] text-ink-muted hover:border-blue hover:text-blue"
          }`}
        >
          Geral
        </button>
        <button
          onClick={() => setVisao("mes")}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
            visao === "mes" ? "bg-blue text-onblue" : "border border-[var(--rule)] text-ink-muted hover:border-blue hover:text-blue"
          }`}
        >
          Desafio do mês
        </button>
      </div>

      {visao === "geral" ? (
        ranking.length === 0 ? (
          <p className="mt-8 text-ink-muted">Ainda não há dados suficientes pro ranking.</p>
        ) : (
          <div className="mt-6 overflow-x-auto border border-[var(--rule)]">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--rule)] bg-paper-alt">
                  <th className="w-14 px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    Pos.
                  </th>
                  <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    Investidor
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    Patrimônio
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr
                    key={`${r.posicao}-${r.apelido}`}
                    className="border-b border-[var(--rule)] last:border-b-0 hover:bg-paper-alt"
                  >
                    <td className="px-3 py-1.5">
                      <Posicao posicao={r.posicao} />
                    </td>
                    <td className="px-3 py-1.5 font-medium text-ink">{r.apelido}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular text-ink">
                      {brl(r.patrimonio)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : rankingMensal.length === 0 ? (
        <p className="mt-8 text-ink-muted">
          Ninguém com dados suficientes ainda este mês, volte depois de investir algo.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-[var(--rule)]">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--rule)] bg-paper-alt">
                <th className="w-14 px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  Pos.
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  Investidor
                </th>
                <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  Ganho no mês
                </th>
                <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                  Variação
                </th>
              </tr>
            </thead>
            <tbody>
              {rankingMensal.map((r) => (
                <tr
                  key={`${r.posicao}-${r.apelido}`}
                  className="border-b border-[var(--rule)] last:border-b-0 hover:bg-paper-alt"
                >
                  <td className="px-3 py-1.5">
                    <Posicao posicao={r.posicao} />
                  </td>
                  <td className="px-3 py-1.5 font-medium text-ink">{r.apelido}</td>
                  <td
                    className={`px-3 py-1.5 text-right font-mono tabular ${
                      r.ganho >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {r.ganho >= 0 ? "+" : ""}
                    {brl(r.ganho)}
                  </td>
                  <td
                    className={`px-3 py-1.5 text-right font-mono tabular ${
                      r.ganhoPct >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {r.ganhoPct >= 0 ? "▲" : "▼"} {numero(Math.abs(r.ganhoPct))}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 font-mono text-[11px] text-ink-muted">
        Patrimônio calculado com a cotação mais recente em cache (atualizada
        a cada poucos minutos), não em tempo real segundo a segundo.
      </p>
    </div>
  );
}
