"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Logomark } from "./Logomark";
import { TickerTape } from "./TickerTape";
import { BotaoVisitante } from "./BotaoVisitante";

export function ConviteEntrar() {
  return (
    <main className="grain relative flex flex-1 flex-col justify-center bg-paper">
      <div className="ruled absolute inset-0 opacity-70" aria-hidden="true" />

      <div className="relative z-[2] mx-auto w-full max-w-3xl px-6 py-24">
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
              Crie sua conta pra começar.
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 max-w-lg border-l-[3px] border-gold pl-5 text-lg leading-relaxed text-ink-muted"
        >
          Você recebe R$ 100.000 fictícios pra comprar e vender ações de
          verdade da bolsa brasileira. Sem cartão, sem CPF, sem risco nenhum.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-9 flex flex-wrap gap-3"
        >
          <Link
            href="/cadastro"
            className="group inline-flex items-center gap-2 bg-blue px-7 py-3.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
          >
            Criar minha conta
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center border border-[var(--rule)] px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-blue hover:text-blue"
          >
            Já tenho conta
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-10 border-t border-[var(--rule)] pt-8"
        >
          <p className="text-sm text-ink-muted">
            Só quer dar uma olhada antes de decidir?
          </p>
          <BotaoVisitante className="mt-3" />
          <p className="mt-3 max-w-md font-mono text-[11px] leading-relaxed text-ink-muted">
            Você entra na hora, sem email nem senha. A carteira fica salva
            neste navegador, e some se você limpar os dados dele.
          </p>
        </motion.div>
      </div>

      <TickerTape speed="slow" />
    </main>
  );
}
