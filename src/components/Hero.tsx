"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { MagneticButton } from "./MagneticButton";
import { CandleChart } from "./CandleChart";
import { TickerTape } from "./TickerTape";

const linhas = ["Investir não", "devia parecer", "outro idioma"];

// Uma unica entrada na carga da pagina: fade curto subindo, com um
// escalonamento pequeno. Sem parallax nem mascara por linha.
const entrada = (atraso: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: atraso, ease: [0.22, 1, 0.36, 1] as const },
});

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-paper">
      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-20 md:pb-28">
        <div className="grid gap-12 md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <div>
            {/* A manchete e voz de marca, nao explicacao. Esta linha diz a
                categoria em texto simples antes da frase, e de quebra e
                conteudo indexavel. */}
            <motion.p {...entrada(0)} className="mb-6 max-w-md text-sm text-ink-muted">
              Simulador de investimentos gratuito, com preços reais da B3 e da
              bolsa americana
            </motion.p>

            <motion.h1
              {...entrada(0.05)}
              className="isolate font-display text-[13vw] leading-[0.96] tracking-tight text-ink sm:text-[9vw] md:text-[5.6rem]"
            >
              {linhas.map((linha, li) => (
                <span key={linha} className="block">
                  <span className="relative inline-block">
                    {linha}
                    {li === 2 && <Grifo />}
                  </span>
                </span>
              ))}
            </motion.h1>

            <motion.p
              {...entrada(0.12)}
              className="mt-8 max-w-lg text-lg leading-relaxed text-ink-muted"
            >
              Você compra e vende ações de verdade da bolsa brasileira, só que
              com dinheiro fictício. Erra, aprende, entende o motivo, e não
              perde um real do seu bolso fazendo isso.
            </motion.p>

            <motion.div {...entrada(0.18)} className="mt-8 flex flex-wrap items-center gap-3">
              <MagneticButton href="/simulador" className="group">
                Testar o simulador agora
                <ArrowRight
                  size={16}
                  strokeWidth={1.5}
                  className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                />
              </MagneticButton>
              <MagneticButton href="#como-funciona" variant="ghost">
                Ver como funciona
              </MagneticButton>
            </motion.div>
          </div>

          {/* Momento 1 da pagina: a carteira. O azul e o dourado moram aqui. */}
          <motion.div
            {...entrada(0.15)}
            className="border border-[var(--rule)] bg-blue p-6 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--rule-inv)] pb-3">
              <span className="text-xs text-onblue-muted">Carteira fictícia</span>
              <span className="font-mono text-xs text-onblue-muted">exemplo</span>
            </div>

            <p className="mt-4 font-mono text-3xl tabular text-gold">
              R$ 103.240<span className="text-onblue-muted">,00</span>
            </p>
            <p className="mt-1 font-mono text-xs tabular text-emerald-400">
              +R$ 3.240,00 (+3,24%) desde o início
            </p>

            <div className="mt-6">
              <CandleChart />
            </div>
          </motion.div>
        </div>
      </div>

      <TickerTape />
    </section>
  );
}

/** Grifo dourado feito à mão sob a linha de destaque: a assinatura do Vestra. */
function Grifo() {
  return (
    <svg
      className="absolute -bottom-1 left-0 -z-10 w-full"
      height="14"
      viewBox="0 0 200 14"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <motion.path
        d="M2 9 C 45 3, 92 12, 138 6 S 190 4, 198 8"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
