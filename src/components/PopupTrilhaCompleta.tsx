"use client";

import { useEffect, useId, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GraduationCap } from "lucide-react";
import { Confete } from "./Confete";

/** Celebra quando a pessoa termina TODOS os artigos da seção Aprender. */
export function PopupTrilhaCompleta({ aoFechar }: { aoFechar: () => void }) {
  const tituloId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") aoFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={aoFechar}
        className="fixed inset-0 z-[88] flex items-end justify-center bg-blue-deep/60 backdrop-blur-sm sm:items-center"
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={tituloId}
          ref={dialogRef}
          tabIndex={-1}
          className="relative w-full max-w-sm overflow-hidden bg-paper p-8 text-center shadow-2xl outline-none"
        >
          <Confete quantidade={36} />

          <button
            onClick={aoFechar}
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
            <GraduationCap size={40} className="text-blue" />
          </motion.div>

          <p id={tituloId} className="mt-5 font-display text-xl font-bold text-ink">
            Trilha completa!
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Você terminou todos os artigos da seção Aprender e passou em
            cada quiz. O próximo passo é colocar isso em prática no
            simulador.
          </p>

          <button
            onClick={aoFechar}
            className="mt-6 w-full bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
          >
            Show de bola
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
