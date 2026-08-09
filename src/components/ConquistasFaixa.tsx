"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  ArrowLeftRight,
  Layers3,
  Landmark,
  Coins,
  Flame,
  CalendarCheck2,
  Gem,
  Lock,
  type LucideIcon,
} from "lucide-react";
import type { Conquista, IconeConquista } from "@/lib/conquistas";

const ICONES: Record<IconeConquista, LucideIcon> = {
  compra: ShoppingCart,
  venda: ArrowLeftRight,
  diversificado: Layers3,
  "renda-fixa": Landmark,
  dividendo: Coins,
  semana: Flame,
  mes: CalendarCheck2,
  patrimonio: Gem,
};

export function ConquistasFaixa({ conquistas }: { conquistas: Conquista[] }) {
  const [aberta, setAberta] = useState<Conquista | null>(null);
  const concluidas = conquistas.filter((c) => c.concluida).length;
  const progresso = (concluidas / conquistas.length) * 100;

  return (
    <div className="mb-8 border border-[var(--rule)] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          Conquistas
        </p>
        <p className="font-mono text-[11px] tabular text-ink-muted">
          {concluidas}/{conquistas.length}
        </p>
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--rule)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progresso}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-gold to-amber-400"
        />
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-8">
        {conquistas.map((c, i) => {
          const Icone = ICONES[c.icone];
          const ativa = aberta?.id === c.id;
          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setAberta(ativa ? null : c)}
              className="group flex flex-col items-center gap-1.5"
            >
              <span
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 ${
                  c.concluida
                    ? "border-gold/60 bg-gradient-to-br from-gold/25 to-amber-400/10 text-gold shadow-[0_0_0_1px_rgba(212,175,55,0.15)] group-hover:shadow-[0_0_16px_rgba(212,175,55,0.35)]"
                    : "border-[var(--rule)] bg-paper-alt text-ink-muted/30 group-hover:border-ink-muted/40"
                } ${ativa ? "scale-105" : ""}`}
              >
                {c.concluida ? (
                  <Icone size={22} strokeWidth={2} />
                ) : (
                  <Lock size={16} strokeWidth={2} />
                )}
              </span>
              <span
                className={`hidden text-center text-[10px] leading-tight sm:block ${
                  c.concluida ? "text-ink-muted" : "text-ink-muted/40"
                }`}
              >
                {c.nome}
              </span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {aberta && (
          <motion.div
            key={aberta.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={`mt-4 flex items-start gap-3 border-l-[3px] p-4 ${
                aberta.concluida ? "border-gold bg-gold/10" : "border-[var(--rule)] bg-paper-alt"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  aberta.concluida ? "bg-gold/20 text-gold" : "bg-[var(--rule)] text-ink-muted"
                }`}
              >
                {(() => {
                  const Icone = ICONES[aberta.icone];
                  return aberta.concluida ? <Icone size={17} /> : <Lock size={15} />;
                })()}
              </span>
              <div>
                <p className="font-semibold text-ink">{aberta.nome}</p>
                <p className="mt-1 text-sm text-ink-muted">{aberta.descricao}</p>
                {!aberta.concluida && (
                  <p className="mt-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                    Ainda não conquistada
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
