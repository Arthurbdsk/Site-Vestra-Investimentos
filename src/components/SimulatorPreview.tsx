"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useVisivel } from "@/lib/useVisivel";
import { ArrowUpRight } from "lucide-react";
import { CountUp } from "./CountUp";
import { Sparkline } from "./Sparkline";

type Papel = {
  ticker: string;
  nome: string;
  qtd: number;
  preco: number;
  variacao: number;
  serie: number[];
  explica: string;
};

const inicial: Papel[] = [
  {
    ticker: "PETR4",
    nome: "Petrobras",
    qtd: 100,
    preco: 38.5,
    variacao: 2.31,
    serie: [34, 35, 33, 36, 37, 38.5],
    explica: "Petróleo. Sobe e desce junto com o preço do barril lá fora.",
  },
  {
    ticker: "ITUB4",
    nome: "Itaú Unibanco",
    qtd: 150,
    preco: 31.22,
    variacao: -0.74,
    serie: [32, 31.6, 31.9, 31.4, 31.1, 31.22],
    explica: "Banco. Costuma ser mais estável e pagar dividendos com frequência.",
  },
  {
    ticker: "WEGE3",
    nome: "WEG",
    qtd: 80,
    preco: 44.9,
    variacao: 1.06,
    serie: [42, 42.8, 43, 43.6, 44.2, 44.9],
    explica: "Indústria de motores. Cresce junto com a economia.",
  },
];

export function SimulatorPreview() {
  const [papeis, setPapeis] = useState(inicial);
  const [flash, setFlash] = useState<Record<string, "up" | "down" | null>>({});
  // Os precos so "piscam" enquanto a secao esta visivel. Fora da tela isso
  // era so re-renderizacao desperdicada a cada 2,6 segundos.
  const { ref, visivel } = useVisivel<HTMLElement>(0.15);

  useEffect(() => {
    if (!visivel) return;
    const id = setInterval(() => {
      setPapeis((prev) => {
        const alvo = Math.floor(Math.random() * prev.length);
        return prev.map((p, i) => {
          if (i !== alvo) return p;
          const delta = (Math.random() - 0.45) * 0.22;
          const novo = Math.max(1, p.preco + delta);
          setFlash((f) => ({ ...f, [p.ticker]: delta >= 0 ? "up" : "down" }));
          setTimeout(() => setFlash((f) => ({ ...f, [p.ticker]: null })), 900);
          return {
            ...p,
            preco: novo,
            variacao: p.variacao + delta * 0.4,
            serie: [...p.serie.slice(1), novo],
          };
        });
      });
    }, 2600);
    return () => clearInterval(id);
  }, [visivel]);

  return (
    <section ref={ref} className="grain relative bg-blue py-24 md:py-32">

      <div className="relative z-[2] mx-auto max-w-6xl px-6">
        <div className="mb-12 flex items-center gap-4">
          <span className="bg-coral px-2 py-1 font-mono text-[11px] font-semibold text-onblue">
            03
          </span>
          <span className="h-px flex-1 bg-[var(--rule-inv)]" />
        </div>

        <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.6 }}
            className="md:sticky md:top-28"
          >
            <h2 className="font-display text-3xl leading-tight text-onblue sm:text-[2.6rem]">
              Cada número aqui vem
              <br />
              <span className="italic text-gold">com legenda.</span>
            </h2>
            <p className="mt-5 max-w-sm leading-relaxed text-onblue-muted">
              Passe o mouse em qualquer papel da carteira e a explicação
              aparece em português. Nada de você olhar pra uma sigla e ter
              que adivinhar o que ela quer dizer.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="border border-[var(--rule-inv)] bg-blue-deep/60"
          >
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--rule-inv)] p-6">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-onblue-muted">
                  Patrimônio
                </p>
                <p className="mt-1.5 font-mono text-4xl tabular text-gold">
                  <CountUp value={103240} prefix="R$ " decimals={2} />
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[11px] uppercase tracking-widest text-onblue-muted">
                  No dia
                </p>
                <p className="mt-1.5 font-mono text-xl tabular text-emerald-400">
                  <CountUp value={3.24} prefix="+" suffix="%" decimals={2} />
                </p>
              </div>
            </div>

            <ul>
              {papeis.map((p, i) => (
                <motion.li
                  key={p.ticker}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.15 + i * 0.1 }}
                  className={`group border-b border-[var(--rule-inv)] last:border-b-0 ${
                    flash[p.ticker] === "up"
                      ? "flash-up"
                      : flash[p.ticker] === "down"
                        ? "flash-down"
                        : ""
                  }`}
                >
                  <div className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.04]">
                    <div className="w-24 shrink-0">
                      <p className="font-mono text-sm font-medium text-gold">
                        {p.ticker}
                      </p>
                      <p className="text-xs text-onblue-muted">{p.nome}</p>
                    </div>

                    <p className="hidden w-20 shrink-0 font-mono text-xs text-onblue-muted sm:block">
                      {p.qtd} cotas
                    </p>

                    <div className="flex-1">
                      <Sparkline
                        points={p.serie}
                        positive={p.variacao >= 0}
                        delay={i * 0.12}
                      />
                    </div>

                    <div className="w-24 shrink-0 text-right">
                      <p className="font-mono text-sm tabular text-onblue">
                        {p.preco.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p
                        className={`font-mono text-xs tabular ${
                          p.variacao >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {p.variacao >= 0 ? "▲" : "▼"}{" "}
                        {Math.abs(p.variacao).toFixed(2).replace(".", ",")}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-rows-[0fr] transition-all duration-300 group-hover:grid-rows-[1fr]">
                    <div className="overflow-hidden">
                      <p className="flex items-start gap-2 px-6 pb-4 text-xs leading-relaxed text-onblue-muted">
                        <ArrowUpRight size={13} className="mt-0.5 shrink-0 text-gold" />
                        {p.explica}
                      </p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>

            <p className="border-t border-[var(--rule-inv)] px-6 py-4 font-mono text-[11px] text-onblue-muted">
              Exemplo ilustrativo. Sua conta começa zerada, com R$ 100.000
              fictícios.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
