"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, TrendingUp, TrendingDown, Plus } from "lucide-react";
import {
  cancelarAlertaPreco,
  criarAlertaPreco,
  marcarAlertaVisto,
} from "@/app/simulador/operacoesAlertas";
import { brl } from "@/lib/formato";

export type AlertaPreco = {
  id: string;
  ticker: string;
  direcao: "acima" | "abaixo";
  precoAlvo: number;
  status: "ativo" | "disparado";
};

/** Banner no topo da pagina pros alertas que ja dispararam e ainda nao foram vistos. */
export function BannerAlertasDisparados({ alertas }: { alertas: AlertaPreco[] }) {
  const router = useRouter();
  const disparados = alertas.filter((a) => a.status === "disparado");
  const [escondidos, setEscondidos] = useState<string[]>([]);

  async function dispensar(id: string) {
    setEscondidos((s) => [...s, id]);
    await marcarAlertaVisto(id);
    router.refresh();
  }

  const visiveis = disparados.filter((a) => !escondidos.includes(a.id));
  if (visiveis.length === 0) return null;

  return (
    <div className="border-b border-gold/40 bg-gold/15">
      <div className="mx-auto max-w-6xl px-6 py-3">
        <AnimatePresence>
          {visiveis.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between gap-3 py-1"
            >
              <p className="flex items-center gap-2 text-sm text-ink">
                <Bell size={15} className="shrink-0 text-blue" />
                <strong>{a.ticker}</strong> bateu {a.direcao === "acima" ? "acima" : "abaixo"} de{" "}
                {brl(a.precoAlvo)}.
              </p>
              <button
                onClick={() => dispensar(a.id)}
                aria-label="Dispensar"
                className="shrink-0 text-ink-muted transition-colors hover:text-ink"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Secao completa de alertas de preco: criar novo + listar/cancelar ativos (Minha carteira). */
export function PainelAlertas({ alertas }: { alertas: AlertaPreco[] }) {
  const router = useRouter();
  const ativos = alertas.filter((a) => a.status === "ativo");
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [ticker, setTicker] = useState("");
  const [direcao, setDirecao] = useState<"acima" | "abaixo">("acima");
  const [preco, setPreco] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function cancelar(id: string) {
    setCancelando(id);
    await cancelarAlertaPreco(id);
    router.refresh();
  }

  async function criar() {
    const precoAlvo = Number(preco.replace(",", "."));
    if (!ticker.trim() || !precoAlvo || precoAlvo <= 0) return;
    setEnviando(true);
    setMensagem(null);
    const resultado = await criarAlertaPreco(ticker.trim().toUpperCase(), direcao, precoAlvo);
    setMensagem(resultado.mensagem);
    setEnviando(false);
    if (resultado.ok) {
      setTicker("");
      setPreco("");
      router.refresh();
    }
  }

  return (
    <div className="mb-8 border border-[var(--rule)] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          Alertas de preço
        </p>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-blue"
        >
          <Plus size={13} />
          Novo alerta
        </button>
      </div>

      {mostrarForm && (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-b border-[var(--rule)] pb-5">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              Ticker
            </label>
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="PETR4"
              className="mt-1 w-28 border border-[var(--rule)] bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-blue"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              Quando
            </label>
            <select
              value={direcao}
              onChange={(e) => setDirecao(e.target.value as "acima" | "abaixo")}
              className="mt-1 border border-[var(--rule)] bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-blue"
            >
              <option value="acima">ficar acima de</option>
              <option value="abaixo">ficar abaixo de</option>
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              Preço-alvo
            </label>
            <input
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="41,00"
              inputMode="decimal"
              className="mt-1 w-28 border border-[var(--rule)] bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-blue"
            />
          </div>
          <button
            onClick={criar}
            disabled={enviando}
            className="bg-blue px-5 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50"
          >
            Criar alerta
          </button>
          {mensagem && <p className="w-full text-xs text-ink-muted">{mensagem}</p>}
        </div>
      )}

      {ativos.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {ativos.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm text-ink">
                {a.direcao === "acima" ? (
                  <TrendingUp size={15} className="text-emerald-600" />
                ) : (
                  <TrendingDown size={15} className="text-rose-600" />
                )}
                <strong>{a.ticker}</strong> {a.direcao === "acima" ? "acima" : "abaixo"} de{" "}
                {brl(a.precoAlvo)}
              </p>
              <button
                onClick={() => cancelar(a.id)}
                disabled={cancelando === a.id}
                className="font-mono text-[11px] uppercase tracking-widest text-ink-muted transition-colors hover:text-rose-600 disabled:opacity-50"
              >
                Cancelar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !mostrarForm && (
          <p className="mt-3 text-sm text-ink-muted">
            Nenhum alerta ativo. Crie um pra ser avisado quando uma ação bater um preço.
          </p>
        )
      )}
    </div>
  );
}
