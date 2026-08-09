"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { brl, pct } from "@/lib/formato";

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
          <ul className="mt-6 border-t border-[var(--rule)]">
            {ranking.map((r, i) => (
              <motion.li
                key={`${r.posicao}-${r.apelido}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="flex items-center justify-between gap-4 border-b border-[var(--rule)] py-3.5"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center font-mono text-sm font-bold ${
                      r.posicao <= 3 ? "bg-gold text-blue" : "text-ink-muted"
                    }`}
                  >
                    {r.posicao <= 3 ? <Trophy size={15} /> : r.posicao}
                  </span>
                  <p className="font-semibold text-ink">{r.apelido}</p>
                </div>
                <p className="font-mono text-sm font-semibold tabular text-blue">
                  {brl(r.patrimonio)}
                </p>
              </motion.li>
            ))}
          </ul>
        )
      ) : rankingMensal.length === 0 ? (
        <p className="mt-8 text-ink-muted">
          Ninguém com dados suficientes ainda este mês — volte depois de investir algo.
        </p>
      ) : (
        <ul className="mt-6 border-t border-[var(--rule)]">
          {rankingMensal.map((r, i) => (
            <motion.li
              key={`${r.posicao}-${r.apelido}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="flex items-center justify-between gap-4 border-b border-[var(--rule)] py-3.5"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center font-mono text-sm font-bold ${
                    r.posicao <= 3 ? "bg-gold text-blue" : "text-ink-muted"
                  }`}
                >
                  {r.posicao <= 3 ? <Trophy size={15} /> : r.posicao}
                </span>
                <p className="font-semibold text-ink">{r.apelido}</p>
              </div>
              <div className="text-right">
                <p
                  className={`font-mono text-sm font-semibold tabular ${
                    r.ganho >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {r.ganho >= 0 ? "+" : ""}
                  {brl(r.ganho)}
                </p>
                <p className="font-mono text-xs tabular text-ink-muted">{pct(r.ganhoPct)}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      <p className="mt-6 font-mono text-[11px] text-ink-muted">
        Ações contam pelo preço médio de compra, não pela cotação atual —
        uma aproximação, não o patrimônio exato de cada pessoa.
      </p>
    </div>
  );
}
