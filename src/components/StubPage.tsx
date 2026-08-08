"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logomark } from "./Logomark";
import { TickerTape } from "./TickerTape";

type StubPageProps = {
  titulo: string;
  descricao: string;
};

export function StubPage({ titulo, descricao }: StubPageProps) {
  return (
    <main className="grain relative flex flex-1 flex-col justify-center bg-paper">

      <div className="relative z-[2] mx-auto w-full max-w-3xl px-6 py-28">
        <motion.div
          initial={{ opacity: 0, rotate: -6, scale: 0.9 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 16 }}
        >
          <Logomark size={52} />
        </motion.div>

        <h1 className="mt-8 font-display text-4xl leading-tight text-ink sm:text-5xl">
          <span className="block overflow-hidden">
            <motion.span
              initial={{ y: "108%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block"
            >
              {titulo}
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-6 max-w-lg border-l-[3px] border-gold pl-5 text-lg leading-relaxed text-ink-muted"
        >
          {descricao}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Link
            href="/"
            className="group mt-9 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-blue transition-colors hover:text-gold"
          >
            <ArrowLeft
              size={14}
              className="transition-transform group-hover:-translate-x-1"
            />
            Voltar pro início
          </Link>
        </motion.div>
      </div>

      <TickerTape speed="slow" />
    </main>
  );
}
