"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame } from "lucide-react";
import { Confete } from "./Confete";

export function PopupStreak({ dias }: { dias: number }) {
  const [aberto, setAberto] = useState(dias > 1);

  if (!aberto) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setAberto(false)}
        className="fixed inset-0 z-[80] flex items-end justify-center bg-blue-deep/60 backdrop-blur-sm sm:items-center"
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm overflow-hidden bg-paper p-8 text-center shadow-2xl"
        >
          {dias >= 3 && <Confete quantidade={dias >= 7 ? 32 : 18} />}

          <button
            onClick={() => setAberto(false)}
            aria-label="Fechar"
            className="absolute right-5 top-5 text-ink-muted transition-colors hover:text-ink"
          >
            <X size={20} />
          </button>

          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.15 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold"
          >
            <Flame size={40} className="text-blue" />
          </motion.div>

          <p className="mt-5 font-mono text-4xl font-bold tabular text-blue">{dias}</p>
          <p className="mt-1 font-display text-xl font-bold text-ink">
            {dias === 1 ? "dia seguido" : "dias seguidos"}!
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Você está voltando todo dia pra investir. Continue assim que a
            consistência é o que mais importa no longo prazo.
          </p>

          <button
            onClick={() => setAberto(false)}
            className="mt-6 w-full bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
          >
            Continuar
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
