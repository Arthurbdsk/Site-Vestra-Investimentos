"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Lock } from "lucide-react";
import type { Conquista } from "@/lib/conquistas";

export function ConquistasFaixa({ conquistas }: { conquistas: Conquista[] }) {
  const [aberta, setAberta] = useState<Conquista | null>(null);
  const concluidas = conquistas.filter((c) => c.concluida).length;

  return (
    <div className="mb-8 border border-[var(--rule)] p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          Conquistas
        </p>
        <p className="font-mono text-[11px] text-ink-muted">
          {concluidas}/{conquistas.length}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {conquistas.map((c) => (
          <button
            key={c.id}
            onClick={() => setAberta(c)}
            className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-colors ${
              c.concluida
                ? "border-gold bg-gold/15 text-gold"
                : "border-[var(--rule)] text-ink-muted/40"
            }`}
            title={c.nome}
          >
            {c.concluida ? <Award size={22} /> : <Lock size={18} />}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {aberta && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={`mt-4 border-l-[3px] p-4 ${
                aberta.concluida ? "border-gold bg-gold/10" : "border-[var(--rule)] bg-paper-alt"
              }`}
            >
              <p className="font-semibold text-ink">{aberta.nome}</p>
              <p className="mt-1 text-sm text-ink-muted">{aberta.descricao}</p>
              {!aberta.concluida && (
                <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                  Ainda não conquistada
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
