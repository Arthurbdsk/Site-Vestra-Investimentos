"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useVisivel } from "@/lib/useVisivel";

const passos = [
  {
    titulo: "Você cria sua conta",
    texto:
      "Leva menos de um minuto. Pede só o essencial, não pede cartão, não pede CPF pra nada.",
    visual: "conta",
  },
  {
    titulo: "Recebe R$ 100.000 fictícios",
    texto:
      "Dinheiro de mentira, de verdade nenhuma. É o seu campo de treino pra errar sem medo.",
    visual: "saldo",
  },
  {
    titulo: "Compra sua primeira ação",
    texto:
      "A gente te mostra o que cada empresa faz antes de você clicar em comprar. Preço real, movimento real.",
    visual: "compra",
  },
  {
    titulo: "Acompanha e entende",
    texto:
      "Sua carteira sobe e desce. E do lado de cada número tem uma explicação do porquê aquilo aconteceu.",
    visual: "carteira",
  },
];

export function HowItWorks() {
  const [ativo, setAtivo] = useState(0);
  const [pausado, setPausado] = useState(false);
  // So avanca sozinho enquanto a secao esta na tela.
  const { ref, visivel } = useVisivel<HTMLElement>(0.2);

  useEffect(() => {
    if (pausado || !visivel) return;
    const id = setInterval(() => setAtivo((a) => (a + 1) % passos.length), 4200);
    return () => clearInterval(id);
  }, [pausado, visivel]);

  return (
    <section
      ref={ref}
      id="como-funciona"
      className="grain relative bg-paper py-24 md:py-32"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 flex items-center gap-4">
          <span className="bg-violet px-2 py-1 font-mono text-[11px] font-semibold text-onblue">
            04
          </span>
          <span className="h-px flex-1 bg-[var(--rule)]" />
        </div>

        <h2 className="max-w-2xl font-display text-3xl leading-tight text-ink sm:text-[2.6rem]">
          Do zero até sua primeira ação.
        </h2>

        <div className="mt-14 grid gap-10 md:grid-cols-[1fr_1fr] md:gap-16">
          <ul className="space-y-1">
            {passos.map((p, i) => {
              const on = i === ativo;
              return (
                <li key={p.titulo}>
                  <button
                    onClick={() => setAtivo(i)}
                    className="group relative w-full border-l-[3px] py-5 pl-6 text-left transition-colors"
                    style={{ borderColor: on ? "var(--color-violet-texto)" : "var(--rule)" }}
                  >
                    {on && (
                      <motion.span
                        layoutId="passo-fundo"
                        className="absolute inset-0 -z-10 bg-paper-alt"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div className="flex items-baseline gap-3">
                      <span
                        className={`font-mono text-xs tabular transition-colors ${
                          on ? "text-violet" : "text-ink-muted"
                        }`}
                      >
                        0{i + 1}
                      </span>
                      <span
                        className={`text-lg font-semibold transition-colors ${
                          on ? "text-ink" : "text-ink-muted group-hover:text-ink"
                        }`}
                      >
                        {p.titulo}
                      </span>
                    </div>

                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden pr-6 text-sm leading-relaxed text-ink-muted"
                        >
                          <span className="mt-2.5 block">{p.texto}</span>
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {on && !pausado && (
                      <motion.span
                        key={ativo}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 4.2, ease: "linear" }}
                        className="absolute -left-[3px] top-0 h-full w-[3px] origin-top bg-violet"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Painel azul de destaque */}
          <div className="relative min-h-[320px] bg-blue p-8 shadow-[0_18px_50px_-24px_rgba(15,45,68,0.5)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={ativo}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.4 }}
                className="flex h-full flex-col justify-center"
              >
                <PassoVisual tipo={passos[ativo].visual} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function PassoVisual({ tipo }: { tipo: string }) {
  if (tipo === "conta") {
    return (
      <div className="space-y-3 font-mono text-sm">
        {["seu@email.com", "••••••••••"].map((v, i) => (
          <motion.div
            key={v}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.12 }}
            className="border border-[var(--rule-inv)] px-4 py-3 text-onblue-muted"
          >
            {v}
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.42 }}
          className="bg-gold px-4 py-3 text-center font-semibold text-blue-deep"
        >
          Criar conta
        </motion.div>
      </div>
    );
  }

  if (tipo === "saldo") {
    return (
      <div className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-onblue-muted">
          Saldo liberado
        </p>
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.15 }}
          className="mt-3 font-mono text-5xl tabular text-gold"
        >
          R$ 100.000
        </motion.p>
        <p className="mt-3 font-mono text-xs text-onblue-muted">
          zero risco • zero dinheiro real
        </p>
      </div>
    );
  }

  if (tipo === "compra") {
    return (
      <div className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--rule-inv)] pb-3 font-mono text-sm">
          <span className="text-gold">PETR4</span>
          <span className="tabular text-onblue">R$ 38,50</span>
        </div>
        <p className="text-sm leading-relaxed text-onblue-muted">
          Petrobras. Empresa de petróleo. O preço tende a acompanhar o valor
          do barril no mercado internacional.
        </p>
        <div className="flex gap-3">
          {[10, 50, 100].map((q, i) => (
            <motion.span
              key={q}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className={`border px-4 py-2 font-mono text-xs ${
                q === 100
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-[var(--rule-inv)] text-onblue-muted"
              }`}
            >
              {q} cotas
            </motion.span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-onblue-muted">
            Sua carteira
          </p>
          <p className="mt-1 font-mono text-3xl tabular text-gold">R$ 103.240</p>
        </div>
        <p className="font-mono text-sm text-emerald-400">▲ 3,24%</p>
      </div>
      <svg viewBox="0 0 240 70" className="w-full">
        <motion.path
          d="M0,58 L40,44 L80,50 L120,28 L160,34 L200,16 L240,8"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </svg>
      <p className="text-xs leading-relaxed text-onblue-muted">
        Subiu porque a Petrobras divulgou lucro acima do esperado. A gente
        te conta o porquê, sempre.
      </p>
    </div>
  );
}
