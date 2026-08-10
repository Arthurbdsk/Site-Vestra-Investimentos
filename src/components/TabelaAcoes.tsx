"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { AcaoB3 } from "@/lib/buscaAcoes";
import { LogoAcao } from "./LogoAcao";
import { brl, numero } from "@/lib/formato";
import { corDoSetor } from "@/lib/coresSetor";
import { BotaoFavorito } from "./BotaoFavorito";

type Coluna = "ticker" | "preco" | "variacao" | "volume" | "valorMercado" | "setor";

const COLUNAS: { id: Coluna; label: string; alinhar?: "right" }[] = [
  { id: "ticker", label: "Ticker" },
  { id: "preco", label: "Preço", alinhar: "right" },
  { id: "variacao", label: "Var %", alinhar: "right" },
  { id: "volume", label: "Volume", alinhar: "right" },
  { id: "valorMercado", label: "Valor de mercado", alinhar: "right" },
  { id: "setor", label: "Setor" },
];

function compacto(v: number | null): string {
  if (v == null) return "-";
  if (v >= 1_000_000_000) return `${numero(v / 1_000_000_000, 1)}B`;
  if (v >= 1_000_000) return `${numero(v / 1_000_000, 1)}M`;
  if (v >= 1_000) return `${numero(v / 1_000, 1)}K`;
  return numero(v, 0);
}

export function TabelaAcoes({
  acoes,
  favoritos,
  aoVerDetalhe,
  aoComprar,
}: {
  acoes: AcaoB3[];
  favoritos?: Set<string>;
  aoVerDetalhe: (ticker: string) => void;
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
}) {
  const [ordenarPor, setOrdenarPor] = useState<Coluna>("valorMercado");
  const [decrescente, setDecrescente] = useState(true);

  function alternarOrdenacao(col: Coluna) {
    if (col === ordenarPor) {
      setDecrescente((d) => !d);
    } else {
      setOrdenarPor(col);
      setDecrescente(true);
    }
  }

  const ordenadas = [...acoes].sort((a, b) => {
    const dir = decrescente ? -1 : 1;
    if (ordenarPor === "ticker" || ordenarPor === "setor") {
      const av = (a[ordenarPor] ?? "").toString();
      const bv = (b[ordenarPor] ?? "").toString();
      return av.localeCompare(bv) * dir;
    }
    const av = a[ordenarPor] ?? -Infinity;
    const bv = b[ordenarPor] ?? -Infinity;
    return (av - bv) * dir;
  });

  return (
    <div className="overflow-x-auto border border-[var(--rule)]">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--rule)] bg-paper-alt">
            {COLUNAS.map((c) => (
              <th
                key={c.id}
                onClick={() => alternarOrdenacao(c.id)}
                className={`cursor-pointer select-none whitespace-nowrap px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted transition-colors hover:text-blue ${
                  c.alinhar === "right" ? "text-right" : "text-left"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {c.label}
                  {ordenarPor === c.id &&
                    (decrescente ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
                </span>
              </th>
            ))}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((a) => (
            <tr key={a.ticker} className="border-b border-[var(--rule)] last:border-b-0 hover:bg-paper-alt">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <BotaoFavorito ticker={a.ticker} favorito={favoritos?.has(a.ticker) ?? false} tamanho={14} />
                  <button
                    onClick={() => aoVerDetalhe(a.ticker)}
                    className="flex items-center gap-2.5 text-left"
                  >
                    <LogoAcao logo={a.logo} ticker={a.ticker} size={26} />
                    <span>
                      <span className="block font-mono text-sm font-semibold text-ink underline decoration-transparent underline-offset-4 hover:text-blue hover:decoration-blue">
                        {a.ticker}
                      </span>
                      <span className="block max-w-[180px] truncate text-xs text-ink-muted">
                        {a.nome}
                      </span>
                    </span>
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono tabular text-ink">
                {a.preco != null ? brl(a.preco) : "-"}
              </td>
              <td
                className={`px-4 py-3 text-right font-mono tabular ${
                  a.variacao == null
                    ? "text-ink-muted"
                    : a.variacao >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                }`}
              >
                {a.variacao != null
                  ? `${a.variacao >= 0 ? "▲" : "▼"} ${numero(Math.abs(a.variacao))}%`
                  : "-"}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular text-ink-muted">
                {compacto(a.volume)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular text-ink-muted">
                {a.valorMercado != null ? `R$ ${compacto(a.valorMercado)}` : "-"}
              </td>
              <td
                className="px-4 py-3 text-xs font-medium"
                style={{ color: a.setor ? corDoSetor(a.setor) : "var(--color-ink-muted)" }}
              >
                {a.setor ?? "-"}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => a.preco != null && aoComprar(a.ticker, a.preco, a.nome)}
                  disabled={a.preco == null}
                  className="border border-blue px-3 py-1.5 font-mono text-xs text-blue transition-colors hover:bg-blue hover:text-onblue disabled:opacity-40"
                >
                  Comprar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
