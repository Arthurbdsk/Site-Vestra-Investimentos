"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { DESBLOQUEIOS } from "@/lib/desbloqueios";
import { Confete } from "./Confete";

const CHAVE = "conquistas_vistas";

/**
 * Compara quantas conquistas a pessoa tinha na ultima visita com
 * quantas tem agora; se isso cruzou o limiar de alguma funcao nova
 * (ver lib/desbloqueios.ts), comemora com confete.
 */
export function PopupDesbloqueio({ conquistasConcluidas }: { conquistasConcluidas: number }) {
  const [novasFuncoes, setNovasFuncoes] = useState<string[]>([]);

  useEffect(() => {
    const anteriorTexto = localStorage.getItem(CHAVE);
    const anterior = anteriorTexto ? Number(anteriorTexto) : 0;

    if (conquistasConcluidas > anterior) {
      const novas = DESBLOQUEIOS.filter(
        (d) => d.minimo > anterior && d.minimo <= conquistasConcluidas,
      ).map((d) => d.label);
      if (novas.length > 0) setNovasFuncoes(novas);
    }

    localStorage.setItem(CHAVE, String(conquistasConcluidas));
    // So roda uma vez por carregamento da pagina, de propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (novasFuncoes.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setNovasFuncoes([])}
        className="fixed inset-0 z-[86] flex items-end justify-center bg-blue-deep/60 backdrop-blur-sm sm:items-center"
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm overflow-hidden bg-paper p-8 text-center shadow-2xl"
        >
          <Confete />

          <button
            onClick={() => setNovasFuncoes([])}
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
            <Sparkles size={36} className="text-blue" />
          </motion.div>

          <p className="mt-5 font-display text-xl font-bold text-ink">
            {novasFuncoes.length === 1 ? "Nova função desbloqueada!" : "Novas funções desbloqueadas!"}
          </p>
          <div className="mt-3 space-y-1.5">
            {novasFuncoes.map((nome) => (
              <p key={nome} className="font-semibold text-blue">
                {nome}
              </p>
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Suas conquistas liberaram isso. Dá uma olhada nas abas do simulador.
          </p>

          <button
            onClick={() => setNovasFuncoes([])}
            className="mt-6 w-full bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
          >
            Show de bola
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
