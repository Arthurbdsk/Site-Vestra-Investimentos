"use client";

import { useMemo, useState } from "react";
import { Scale } from "lucide-react";
import type { Posicao } from "./PainelSimulador";
import type { Cotacao } from "@/lib/cotacoes";
import { numero } from "@/lib/formato";

/**
 * Diferente do Planejador (que sugere onde colocar dinheiro NOVO), isso
 * aqui olha pro que a pessoa ja tem e calcula o que faltaria comprar ou
 * vender de cada posicao pra chegar num peso-alvo escolhido por ela.
 */
export function RebalanceamentoPainel({
  posicoes,
  precoDe,
  saldo,
  aoOperar,
}: {
  posicoes: Posicao[];
  precoDe: (ticker: string) => Cotacao | null;
  saldo: number;
  aoOperar: (ticker: string, preco: number, tipo: "comprar" | "vender", limite: number) => void;
}) {
  const tickers = useMemo(() => posicoes.map((p) => p.ticker), [posicoes]);
  const [alvos, setAlvos] = useState<Record<string, number>>(() =>
    Object.fromEntries(tickers.map((t) => [t, Math.round(100 / (tickers.length || 1))])),
  );

  const linhas = useMemo(() => {
    return posicoes.map((p) => {
      const preco = precoDe(p.ticker)?.preco ?? p.preco_medio;
      return { ticker: p.ticker, quantidade: p.quantidade, preco, valorAtual: p.quantidade * preco };
    });
  }, [posicoes, precoDe]);

  const totalAtual = linhas.reduce((s, l) => s + l.valorAtual, 0);
  const somaAlvos = tickers.reduce((s, t) => s + (alvos[t] ?? 0), 0);

  function igualarPesos() {
    const peso = Math.round(100 / (tickers.length || 1));
    setAlvos(Object.fromEntries(tickers.map((t) => [t, peso])));
  }

  if (posicoes.length < 2) {
    return (
      <div>
        <h2 className="font-display text-2xl text-ink">Rebalancear carteira</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-ink-muted">
          Você precisa de pelo menos duas ações em carteira pra rebalancear
          o peso entre elas. Compre mais uma ação diferente e volte aqui.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Rebalancear carteira</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Escolha o peso que cada ação deveria ter na sua carteira de ações
        (não conta caixa nem renda fixa). A gente calcula quanto comprar ou
        vender de cada uma pra chegar lá.
      </p>

      <button
        onClick={igualarPesos}
        className="mt-4 flex items-center gap-2 border border-[var(--rule)] px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:border-blue hover:text-blue"
      >
        <Scale size={14} />
        Pesos iguais pra todas
      </button>

      <div className="mt-5 overflow-x-auto border border-[var(--rule)]">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--rule)] bg-paper-alt">
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                Ação
              </th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                Peso atual
              </th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                Peso alvo
              </th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                Ação sugerida
              </th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const pesoAtual = totalAtual > 0 ? (l.valorAtual / totalAtual) * 100 : 0;
              const alvoPct = alvos[l.ticker] ?? 0;
              const valorAlvo = totalAtual * (alvoPct / 100);
              const delta = valorAlvo - l.valorAtual;
              const cotasDelta = l.preco > 0 ? Math.floor(Math.abs(delta) / l.preco) : 0;
              const relevante = Math.abs(delta) > l.preco && cotasDelta > 0;

              return (
                <tr key={l.ticker} className="border-b border-[var(--rule)] last:border-b-0 hover:bg-paper-alt">
                  <td className="px-3 py-2 font-mono font-semibold text-ink">{l.ticker}</td>
                  <td className="px-3 py-2 text-right font-mono tabular text-ink-muted">
                    {numero(pesoAtual, 1)}%
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={alvoPct}
                      onChange={(e) =>
                        setAlvos((prev) => ({
                          ...prev,
                          [l.ticker]: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                        }))
                      }
                      className="w-16 border border-[var(--rule)] bg-paper px-2 py-1 text-right font-mono tabular text-ink outline-none focus:border-blue"
                    />
                    <span className="ml-1 text-ink-muted">%</span>
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono tabular ${
                      !relevante ? "text-ink-muted" : delta > 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {!relevante ? "já está perto" : delta > 0 ? `comprar ~${cotasDelta}` : `vender ~${cotasDelta}`}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {relevante && (
                      <button
                        onClick={() =>
                          aoOperar(
                            l.ticker,
                            l.preco,
                            delta > 0 ? "comprar" : "vender",
                            delta > 0 ? saldo : l.quantidade,
                          )
                        }
                        className="font-mono text-[11px] uppercase tracking-widest text-blue hover:text-blue-deep"
                      >
                        Ajustar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {somaAlvos !== 100 && (
        <p className="mt-3 text-xs text-ink-muted">
          Os pesos-alvo somam {somaAlvos}%, não 100%. As sugestões acima
          ainda funcionam, mas o resultado não vai fechar a carteira toda
          numa distribuição exata.
        </p>
      )}

      <p className="mt-6 font-mono text-[11px] leading-relaxed text-ink-muted">
        As quantidades sugeridas são aproximadas (arredondadas pra cota
        inteira) e calculadas com a cotação mais recente em cache, não em
        tempo real.
      </p>
    </div>
  );
}
