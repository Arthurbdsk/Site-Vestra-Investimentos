"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { MagneticButton } from "./MagneticButton";
import { CandleChart } from "./CandleChart";
import { TickerTape } from "./TickerTape";

const linhas = ["Investir não", "devia parecer", "outro idioma."];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="grain relative overflow-hidden bg-paper">
      <div
        className="halo -right-32 -top-24 h-[560px] w-[560px] bg-blue/10"
        aria-hidden="true"
      />
      <div
        className="halo -left-40 top-64 h-[380px] w-[380px] bg-gold/20"
        aria-hidden="true"
      />

      <motion.div
        style={{ y, opacity: fade }}
        className="relative z-[2] mx-auto max-w-6xl px-6 pt-14 pb-20 md:pt-20 md:pb-28"
      >
        <div className="grid gap-14 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div>
            <h1 className="font-display text-[13vw] leading-[0.94] tracking-tight text-ink sm:text-[9vw] md:text-[5.6rem]">
              {linhas.map((linha, li) => (
                <span key={linha} className="block overflow-hidden">
                  <motion.span
                    className={`relative inline-block ${li === 2 ? "italic" : ""}`}
                    initial={{ y: "108%" }}
                    animate={{ y: "0%" }}
                    transition={{
                      duration: 0.85,
                      delay: 0.1 + li * 0.13,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {linha}
                    {li === 2 && <Grifo />}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="mt-10 max-w-lg border-l-[3px] border-gold pl-5"
            >
              <p className="text-lg leading-relaxed text-ink-muted">
                Você compra e vende ações de verdade da bolsa brasileira, só
                que com dinheiro fictício. Erra, aprende, entende o motivo, e
                não perde um real do seu bolso fazendo isso.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.75 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <MagneticButton href="/simulador" className="group">
                Testar o simulador agora
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </MagneticButton>
              <MagneticButton href="#como-funciona" variant="ghost">
                Ver como funciona
              </MagneticButton>
            </motion.div>
          </div>

          {/* Painel azul: o azul entra como bloco de destaque */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="bg-blue p-5 shadow-[0_18px_50px_-20px_rgba(15,45,68,0.55)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--rule-inv)] pb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-onblue-muted">
                Carteira fictícia
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                <span className="animate-blink inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                ao vivo
              </span>
            </div>

            <p className="mt-4 font-mono text-3xl tabular text-gold">
              R$ 103.240<span className="text-onblue-muted">,00</span>
            </p>
            <p className="mt-1 font-mono text-xs text-emerald-400">
              +3.240,00 desde que você começou
            </p>

            <div className="mt-5">
              <CandleChart />
            </div>
          </motion.div>
        </div>
      </motion.div>

      <TickerTape />
    </section>
  );
}

/** Grifo dourado feito à mão sob a linha de destaque. */
function Grifo() {
  return (
    <svg
      className="absolute -bottom-1 left-0 w-full"
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
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.95, ease: "easeInOut" }}
      />
    </svg>
  );
}
