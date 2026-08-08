"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TituloRevelado, Surge } from "./TituloRevelado";
import { brl } from "@/lib/formato";

const OPCOES = [25, 50, 100, 200];
const ANOS = 30;
const TAXA_ANUAL = 0.1;

/** Quanto vira um deposito mensal, ano a ano, com juros compostos. */
function projetar(mensal: number) {
  const i = Math.pow(1 + TAXA_ANUAL, 1 / 12) - 1;
  const pontos: { ano: number; guardado: number; total: number }[] = [];

  for (let ano = 0; ano <= ANOS; ano++) {
    const meses = ano * 12;
    const total = meses === 0 ? 0 : mensal * ((Math.pow(1 + i, meses) - 1) / i);
    pontos.push({ ano, guardado: mensal * meses, total });
  }
  return pontos;
}

const L = 600;
const A = 200;

export function Manifesto() {
  const [mensal, setMensal] = useState(50);
  const pontos = projetar(mensal);
  const fim = pontos[pontos.length - 1];
  const teto = fim.total;

  const x = (ano: number) => (ano / ANOS) * L;
  const y = (v: number) => A - (v / teto) * A;

  const linha = (chave: "total" | "guardado") =>
    pontos
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.ano).toFixed(1)},${y(p[chave]).toFixed(1)}`)
      .join(" ");

  const area = `${linha("total")} L${L},${A} L0,${A} Z`;

  return (
    <section className="grain relative overflow-hidden bg-paper py-24 md:py-36">
      <div
        className="halo -left-40 top-10 h-[420px] w-[420px] bg-gold/20"
        aria-hidden="true"
      />

      <div className="relative z-[2] mx-auto max-w-6xl px-6">
        <Surge>
          <span className="bg-gold px-2 py-1 font-mono text-[11px] font-semibold text-blue">
            01
          </span>
        </Surge>

        <TituloRevelado
          linhas={["Investir não é", "coisa de rico."]}
          destaque={1}
          fundo="claro"
          atraso={0.1}
          className="mt-8 font-display text-[12vw] leading-[0.95] tracking-tight text-ink sm:text-[8vw] md:text-[5.2rem]"
        />

        <Surge atraso={0.15} className="mt-8 max-w-xl">
          <p className="text-lg leading-relaxed text-ink-muted">
            É o que te contaram pra você nem tentar. Veja com seus próprios
            olhos o que acontece guardando pouco, todo mês, por bastante tempo.
          </p>
        </Surge>

        {/* Prova interativa */}
        <Surge atraso={0.2} className="mt-14">
          <div className="bg-blue p-6 shadow-[0_30px_70px_-30px_rgba(15,45,68,0.6)] sm:p-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-onblue-muted">
              Se você guardasse por mês
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {OPCOES.map((v) => {
                const ativo = v === mensal;
                return (
                  <button
                    key={v}
                    onClick={() => setMensal(v)}
                    className={`relative px-5 py-2.5 font-mono text-sm transition-colors ${
                      ativo ? "text-blue" : "text-onblue-muted hover:text-onblue"
                    }`}
                  >
                    {ativo && (
                      <motion.span
                        layoutId="pilula-valor"
                        className="absolute inset-0 bg-gold"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">R$ {v}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-end">
              <div className="space-y-7">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-onblue-muted">
                    Você teria guardado
                  </p>
                  <p className="mt-1 font-mono text-2xl tabular text-onblue">
                    {brl(fim.guardado)}
                  </p>
                </div>

                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-onblue-muted">
                    Poderia ter virado
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={mensal}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35 }}
                      className="mt-1 font-mono text-4xl tabular text-gold sm:text-5xl"
                    >
                      {brl(fim.total)}
                    </motion.p>
                  </AnimatePresence>
                  <p className="mt-2 font-mono text-xs text-onblue-muted">
                    em {ANOS} anos
                  </p>
                </div>
              </div>

              <div>
                <svg viewBox={`0 0 ${L} ${A}`} className="w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="areaOuro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <motion.path
                    key={`area-${mensal}`}
                    d={area}
                    fill="url(#areaOuro)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                  />

                  {/* O que você guardou: cresce reto */}
                  <motion.path
                    key={`guardado-${mensal}`}
                    d={linha("guardado")}
                    fill="none"
                    stroke="var(--color-onblue-muted)"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, ease: "easeInOut" }}
                  />

                  {/* O que os juros fizeram: curva */}
                  <motion.path
                    key={`total-${mensal}`}
                    d={linha("total")}
                    fill="none"
                    stroke="var(--color-gold)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: "easeInOut" }}
                  />
                </svg>

                <div className="mt-3 flex flex-wrap gap-5 font-mono text-[11px] text-onblue-muted">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-0 w-5 border-t-2 border-dashed border-onblue-muted" />
                    o que saiu do seu bolso
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-[3px] w-5 bg-gold" />
                    com os juros trabalhando
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-9 border-t border-[var(--rule-inv)] pt-5 font-mono text-[11px] leading-relaxed text-onblue-muted">
              Simulação hipotética a 10% ao ano, só pra mostrar o efeito dos
              juros compostos. Não é promessa de retorno nem recomendação de
              investimento. Rendimento passado não garante rendimento futuro.
            </p>
          </div>
        </Surge>
      </div>
    </section>
  );
}
