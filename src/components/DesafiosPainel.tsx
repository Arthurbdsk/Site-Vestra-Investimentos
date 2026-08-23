"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { ativoPorTicker } from "@/lib/ativos";
import type { Posicao, Transacao } from "./PainelSimulador";

type Desafio = { id: string; titulo: string; concluido: boolean };

/**
 * Diferente das conquistas (vitrine passiva de troféus), isso é uma
 * lista prescritiva: o que fazer a seguir, em ordem. As mesmas ações
 * contam pras duas coisas, só a moldura é diferente.
 */
export function DesafiosPainel({
  posicoes,
  transacoes,
  favoritos,
  perfilInvestidorDefinido,
  temRendaFixa,
  temDuelo,
  diasSeguidos,
}: {
  posicoes: Posicao[];
  transacoes: Transacao[];
  favoritos: string[];
  perfilInvestidorDefinido: boolean;
  temRendaFixa: boolean;
  temDuelo: boolean;
  diasSeguidos: number;
}) {
  const [aberto, setAberto] = useState(true);

  const setoresDistintos = useMemo(() => {
    const setores = new Set(
      posicoes.map((p) => ativoPorTicker(p.ticker)?.setor).filter((s): s is string => !!s),
    );
    return setores.size;
  }, [posicoes]);

  const desafios: Desafio[] = [
    { id: "compra", titulo: "Compre sua primeira ação", concluido: transacoes.some((t) => t.tipo === "compra") },
    { id: "setores", titulo: "Diversifique em 3 setores diferentes", concluido: setoresDistintos >= 3 },
    { id: "venda", titulo: "Venda uma ação", concluido: transacoes.some((t) => t.tipo === "venda") },
    { id: "favorito", titulo: "Favorite uma ação pra acompanhar", concluido: favoritos.length > 0 },
    { id: "perfil", titulo: "Descubra seu perfil de investidor", concluido: perfilInvestidorDefinido },
    { id: "renda-fixa", titulo: "Invista em renda fixa", concluido: temRendaFixa },
    { id: "duelo", titulo: "Desafie alguém pra um duelo", concluido: temDuelo },
    { id: "streak", titulo: "Volte 7 dias seguidos", concluido: diasSeguidos >= 7 },
  ];

  const concluidos = desafios.filter((d) => d.concluido).length;
  if (concluidos === desafios.length) return null;

  return (
    <div className="border border-[var(--rule)]">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div>
          <h2 className="font-display text-lg text-ink">O que fazer a seguir</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {concluidos} de {desafios.length} concluídos
          </p>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-ink-muted transition-transform ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ul className="border-t border-[var(--rule)]">
              {desafios.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 border-b border-[var(--rule)] px-5 py-2.5 last:border-b-0"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                      d.concluido ? "border-emerald-600 bg-emerald-600 text-white" : "border-[var(--rule)]"
                    }`}
                  >
                    {d.concluido && <Check size={10} />}
                  </span>
                  <span className={`text-sm ${d.concluido ? "text-ink-muted line-through" : "text-ink"}`}>
                    {d.titulo}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
