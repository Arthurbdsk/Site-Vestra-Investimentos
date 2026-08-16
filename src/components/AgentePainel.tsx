"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, Loader2, Play, TrendingUp, TrendingDown, Minus, AlertCircle, Settings2 } from "lucide-react";
import { criarAgente, rodarAgente } from "@/app/simulador/operacoesAgente";
import { dataHora } from "@/lib/formato";

export type PerfilRisco = "conservador" | "moderado" | "agressivo";

export type Agente = {
  existe: boolean;
  perfilRisco?: PerfilRisco;
  regraPersonalizada?: string | null;
  stopLossPct?: number | null;
  stopGainPct?: number | null;
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
  const [editando, setEditando] = useState(!agente.existe);
  const [rodando, setRodando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

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
        Um modelo de IA analisa sua carteira, cotações reais da B3 e fundamentos
        (beta, P/L, dividend yield), e decide sozinho comprar, vender ou manter.
        Limite de 10 execuções por dia.
      </p>

      {editando ? (
        <ConfiguracaoAgente
          agente={agente}
          aoSalvar={() => {
            setEditando(false);
            router.refresh();
          }}
        />
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border border-[var(--rule)] p-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                Perfil ativo
              </p>
              <p className="mt-1 font-display text-xl text-ink capitalize">{agente.perfilRisco}</p>
              {(agente.stopLossPct || agente.stopGainPct) && (
                <p className="mt-1 text-xs text-ink-muted">
                  {agente.stopLossPct ? `Stop loss em -${agente.stopLossPct}%` : null}
                  {agente.stopLossPct && agente.stopGainPct ? " · " : null}
                  {agente.stopGainPct ? `Stop gain em +${agente.stopGainPct}%` : null}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-ink-muted">
                {agente.restantesHoje ?? 0} de 10 execuções restantes hoje
              </p>
              <button
                onClick={() => setEditando(true)}
                className="text-ink-muted transition-colors hover:text-blue"
                aria-label="Editar configuração"
              >
                <Settings2 size={18} />
              </button>
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

          {agente.regraPersonalizada && (
            <p className="mt-3 border-l-[3px] border-gold pl-4 text-sm leading-relaxed text-ink-muted">
              Regra própria: "{agente.regraPersonalizada}"
            </p>
          )}

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

function ConfiguracaoAgente({ agente, aoSalvar }: { agente: Agente; aoSalvar: () => void }) {
  const [, iniciar] = useTransition();
  const [perfil, setPerfil] = useState<PerfilRisco>(agente.perfilRisco ?? "moderado");
  const [regra, setRegra] = useState(agente.regraPersonalizada ?? "");
  const [stopLoss, setStopLoss] = useState(agente.stopLossPct?.toString() ?? "");
  const [stopGain, setStopGain] = useState(agente.stopGainPct?.toString() ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function salvar() {
    setSalvando(true);
    setErro(null);
    iniciar(async () => {
      const r = await criarAgente(
        perfil,
        regra.trim() || null,
        stopLoss.trim() ? Number(stopLoss) : null,
        stopGain.trim() ? Number(stopGain) : null,
      );
      setSalvando(false);
      if (!r.ok) {
        setErro(r.mensagem);
        return;
      }
      aoSalvar();
    });
  }

  return (
    <div className="mt-6 border border-[var(--rule)] p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
        Perfil de risco
      </p>
      <div className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-3">
        {PERFIS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPerfil(p.id)}
            className={`p-4 text-left transition-colors ${
              perfil === p.id ? "bg-blue text-onblue" : "bg-paper hover:bg-paper-alt"
            }`}
          >
            <p className="font-display text-base">{p.nome}</p>
            <p className={`mt-1 text-xs ${perfil === p.id ? "text-onblue-muted" : "text-ink-muted"}`}>
              {p.descricao}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-5">
        <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          Regra própria (opcional)
        </label>
        <textarea
          value={regra}
          onChange={(e) => setRegra(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder='Ex: "só compre ações com beta acima de 1" ou "prefira dividend yield alto"'
          className="mt-2 w-full resize-none border border-[var(--rule)] bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-blue"
        />
        <p className="mt-1 text-right font-mono text-[10px] text-ink-muted">{regra.length}/500</p>
      </div>

      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Stop loss (%, opcional)
          </label>
          <p className="mt-1 text-xs text-ink-muted">Vende automaticamente se cair esse tanto após comprar.</p>
          <input
            type="number"
            min={1}
            max={99}
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="Ex: 10"
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-4 py-2.5 text-sm tabular text-ink outline-none focus:border-blue"
          />
        </div>
        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Stop gain (%, opcional)
          </label>
          <p className="mt-1 text-xs text-ink-muted">Vende automaticamente se subir esse tanto após comprar.</p>
          <input
            type="number"
            min={1}
            value={stopGain}
            onChange={(e) => setStopGain(e.target.value)}
            placeholder="Ex: 20"
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-4 py-2.5 text-sm tabular text-ink outline-none focus:border-blue"
          />
        </div>
      </div>

      {erro && <p className="mt-4 text-sm text-rose-600">{erro}</p>}

      <button
        onClick={salvar}
        disabled={salvando}
        className="mt-5 bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50"
      >
        {agente.existe ? "Salvar configuração" : "Criar agente"}
      </button>
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
