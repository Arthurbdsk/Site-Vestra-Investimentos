"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Target } from "lucide-react";
import { gerarPlano, OBJETIVOS, type Plano, type Objetivo } from "@/lib/planejador";
import { LogoAcao } from "./LogoAcao";
import { brl, numero } from "@/lib/formato";

export function PlanejadorPainel({
  aoComprar,
}: {
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
}) {
  const [valor, setValor] = useState(500_000);
  const [prazoAnos, setPrazoAnos] = useState(2);
  const [objetivo, setObjetivo] = useState<Objetivo>("rentabilidade");
  const [plano, setPlano] = useState<Plano | null>(null);
  const [comprando, setComprando] = useState<string | null>(null);
  const [erroCompra, setErroCompra] = useState<string | null>(null);

  function gerar() {
    setPlano(gerarPlano(valor, prazoAnos, objetivo));
  }

  async function comprarAgora(ticker: string, nome: string) {
    setComprando(ticker);
    setErroCompra(null);
    try {
      const resposta = await fetch(`/api/acoes?q=${encodeURIComponent(ticker)}`);
      const json = await resposta.json();
      const encontrada = json.acoes?.find((a: { ticker: string }) => a.ticker === ticker);
      if (encontrada?.preco != null) {
        aoComprar(ticker, encontrada.preco, nome);
      } else {
        // Sem este aviso o botao apenas piscava e voltava ao normal, sem
        // modal e sem explicacao, quando a cotacao nao vinha.
        setErroCompra(`Não consegui buscar o preço de ${ticker} agora. Tente de novo em instantes.`);
      }
    } catch {
      setErroCompra(`Não consegui buscar o preço de ${ticker} agora. Tente de novo em instantes.`);
    } finally {
      setComprando(null);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Planejador de investimento</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Diga quanto quer investir, por quanto tempo e o que você prioriza:
        a gente monta uma sugestão de alocação entre renda fixa e ações.
      </p>

      <div className="mt-8 grid gap-5 border border-[var(--rule)] bg-paper-alt p-6 sm:grid-cols-3">
        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Quanto investir (R$)
          </label>
          <input
            type="number"
            min={1}
            value={valor}
            onChange={(e) => setValor(Math.max(1, Number(e.target.value) || 1))}
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-4 py-3 font-mono tabular text-ink outline-none focus:border-blue"
          />
        </div>

        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Por quantos anos
          </label>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={prazoAnos}
            onChange={(e) => setPrazoAnos(Math.max(0.5, Number(e.target.value) || 0.5))}
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-4 py-3 font-mono tabular text-ink outline-none focus:border-blue"
          />
        </div>

        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Prioridade
          </label>
          <select
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value as Objetivo)}
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none focus:border-blue"
          >
            {OBJETIVOS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={gerar}
          className="flex items-center justify-center gap-2 bg-blue px-6 py-3.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep sm:col-span-3"
        >
          <Target size={16} />
          Gerar plano
        </button>
      </div>

      {plano && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            {brl(plano.valorTotal)} · {plano.prazoAnos}{" "}
            {plano.prazoAnos === 1 ? "ano" : "anos"} ·{" "}
            {OBJETIVOS.find((o) => o.id === plano.objetivo)?.label}
          </p>

          <div className="mt-3 flex h-3 w-full overflow-hidden">
            <div className="bg-blue" style={{ width: `${plano.percentualRendaFixa}%` }} />
            <div className="bg-gold" style={{ width: `${100 - plano.percentualRendaFixa}%` }} />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[11px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-blue" /> Renda fixa · {numero(plano.percentualRendaFixa, 0)}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-gold" /> Ações · {numero(100 - plano.percentualRendaFixa, 0)}%
            </span>
          </div>

          <ul className="mt-6 border-t border-[var(--rule)]">
            {plano.itens.map((item, i) => (
              <motion.li
                key={item.ticker ?? item.nome}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-[var(--rule)] py-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {item.ticker ? (
                      <LogoAcao logo={null} ticker={item.ticker} size={32} />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-blue font-mono text-xs font-bold text-gold">
                        RF
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-ink">{item.nome}</p>
                      <p className="font-mono text-xs text-ink-muted">
                        {numero(item.percentual, 1)}% da carteira
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="font-mono text-lg tabular text-ink">{brl(item.valor)}</p>
                    {item.tipo === "acao" && item.ticker && (
                      <button
                        onClick={() => comprarAgora(item.ticker!, item.nome)}
                        disabled={comprando === item.ticker}
                        className="flex items-center gap-1.5 border border-blue px-3 py-2 font-mono text-xs text-blue transition-colors hover:bg-blue hover:text-onblue disabled:opacity-50"
                      >
                        {comprando === item.ticker ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          "Comprar"
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.quandoVender}</p>
              </motion.li>
            ))}
          </ul>

          {erroCompra && (
            <p className="mt-4 text-sm leading-relaxed text-rose-600">{erroCompra}</p>
          )}

          <p className="mt-6 font-mono text-[11px] text-ink-muted">
            Sugestão educativa, não recomendação de investimento. Renda
            fixa investe pela aba "Renda fixa"; as ações você já pode
            comprar direto por aqui.
          </p>
        </motion.div>
      )}
    </div>
  );
}
