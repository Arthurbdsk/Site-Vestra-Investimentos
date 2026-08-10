"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, Loader2, Play, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { criarAgente, rodarAgente } from "@/app/simulador/operacoesAgente";
import { dataHora } from "@/lib/formato";

export type PerfilRisco = "conservador" | "moderado" | "agressivo";

export type Agente = {
  existe: boolean;
  perfilRisco?: PerfilRisco;
  restantesHoje?: number;
};

export type DecisaoAgente = {
  id: string;
  ticker: string | null;
  acao: "comprar" | "vender" | "manter";
  quantidade: number;
  justificativa: string;
  executado: boolean;
  erro: string | null;
  criadoEm: string;
};

const PERFIS: { id: PerfilRisco; nome: string; descricao: string }[] = [
  { id: "conservador", nome: "Conservador", descricao: "No máximo 10% do saldo por operação." },
  { id: "moderado", nome: "Moderado", descricao: "No máximo 20% do saldo por operação." },
  { id: "agressivo", nome: "Agressivo", descricao: "No máximo 40% do saldo por operação." },
];

export function AgentePainel({ agente, decisoes }: { agente: Agente; decisoes: DecisaoAgente[] }) {
  const router = useRouter();
  const [, iniciar] = useTransition();
  const [criando, setCriando] = useState(false);
  const [rodando, setRodando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  function configurar(perfil: PerfilRisco) {
    setCriando(true);
    iniciar(async () => {
      await criarAgente(perfil);
      setCriando(false);
      router.refresh();
    });
  }

  function rodar() {
    setRodando(true);
    setMensagem(null);
    iniciar(async () => {
      const r = await rodarAgente();
      setRodando(false);
      setMensagem(r.mensagem);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
        <Bot size={22} className="text-blue" />
        Agente de investimento
      </h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Um modelo de IA analisa sua carteira e as cotações reais da B3, e decide
        sozinho comprar, vender ou manter, respeitando o perfil de risco que
        você escolher. Limite de 3 execuções por dia.
      </p>

      {!agente.existe ? (
        <div className="mt-8 grid gap-px bg-[var(--rule)] sm:grid-cols-3">
          {PERFIS.map((p) => (
            <button
              key={p.id}
              onClick={() => configurar(p.id)}
              disabled={criando}
              className="bg-paper p-5 text-left transition-colors hover:bg-paper-alt disabled:opacity-50"
            >
              <p className="font-display text-lg text-ink">{p.nome}</p>
              <p className="mt-1.5 text-sm text-ink-muted">{p.descricao}</p>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border border-[var(--rule)] p-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                Perfil ativo
              </p>
              <p className="mt-1 font-display text-xl text-ink capitalize">{agente.perfilRisco}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-ink-muted">
                {agente.restantesHoje ?? 0} de 3 execuções restantes hoje
              </p>
              <button
                onClick={rodar}
                disabled={rodando || (agente.restantesHoje ?? 0) <= 0}
                className="flex items-center gap-2 bg-blue px-5 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50"
              >
                {rodando ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                Rodar agora
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {PERFIS.map((p) => (
              <button
                key={p.id}
                onClick={() => configurar(p.id)}
                disabled={criando}
                className={`px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                  agente.perfilRisco === p.id
                    ? "bg-blue text-onblue"
                    : "border border-[var(--rule)] text-ink-muted hover:border-blue hover:text-blue"
                }`}
              >
                {p.nome}
              </button>
            ))}
          </div>

          {mensagem && (
            <p className="mt-4 border-l-[3px] border-gold bg-gold/10 px-4 py-3 text-sm text-ink">
              {mensagem}
            </p>
          )}

          {decisoes.length > 0 && (
            <div className="mt-10">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                Histórico de decisões
              </p>
              <ul className="mt-4 space-y-3">
                {decisoes.map((d, i) => (
                  <DecisaoLinha key={d.id} decisao={d} delay={i * 0.04} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DecisaoLinha({ decisao, delay }: { decisao: DecisaoAgente; delay: number }) {
  const Icone = decisao.acao === "comprar" ? TrendingUp : decisao.acao === "vender" ? TrendingDown : Minus;
  const cor =
    decisao.acao === "comprar" ? "text-emerald-600" : decisao.acao === "vender" ? "text-rose-600" : "text-ink-muted";

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="border border-[var(--rule)] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 font-mono text-sm font-semibold text-ink">
          <Icone size={15} className={cor} />
          {decisao.acao === "manter"
            ? "Manter"
            : `${decisao.acao === "comprar" ? "Comprar" : "Vender"} ${decisao.quantidade} de ${decisao.ticker}`}
        </p>
        <p className="shrink-0 font-mono text-[11px] text-ink-muted">{dataHora(decisao.criadoEm)}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{decisao.justificativa}</p>
      {decisao.acao !== "manter" && !decisao.executado && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
          <AlertCircle size={12} />
          Não executado{decisao.erro ? `: ${decisao.erro}` : ""}
        </p>
      )}
    </motion.li>
  );
}
