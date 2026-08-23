"use client";

import { Loader2 } from "lucide-react";
import { CartaoAcaoPopular, ResultadosFundo } from "./ExplorarCartoes";
import { ETFS } from "@/lib/etfs";
import type { AcaoB3 } from "@/lib/buscaAcoes";

/** Aba "ETF" do Explorar. Extraida de PainelSimulador.tsx. */
export function ExplorarEtf({
  busca,
  setBusca,
  acoesEtf,
  popularesEtf,
  buscaFundoAtrasada,
  resultadosFundo,
  carregandoFundo,
  erroFundo,
  favoritos,
  aoComprar,
  aoVerDetalhe,
}: {
  busca: string;
  setBusca: (v: string) => void;
  acoesEtf: AcaoB3[] | null;
  popularesEtf: { ticker: string; nome: string; setor: string; explica: string }[];
  buscaFundoAtrasada: string;
  resultadosFundo: AcaoB3[];
  carregandoFundo: boolean;
  erroFundo: string | null;
  favoritos: Set<string>;
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
  aoVerDetalhe: (ticker: string) => void;
}) {
  return (
    <>
      <h2 className="mt-4 font-display text-2xl text-ink">
        Escolha um ETF
      </h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        ETFs seguem um índice inteiro numa única cota (tipo o Ibovespa ou
        o S&P 500), em vez de você escolher ação por ação. Também são
        negociados na B3 como uma ação comum. Explicamos alguns, mas
        busque qualquer código pra comprar qualquer um dos mais de 180
        ETFs da bolsa.
      </p>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome, código ou índice (ex: Ibovespa, S&P 500)"
        className="mt-6 w-full max-w-sm border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-blue"
      />

      {acoesEtf === null ? (
        <div className="mt-6 flex items-center gap-2 text-ink-muted">
          <Loader2 size={16} className="animate-spin" />
          Carregando ETFs…
        </div>
      ) : popularesEtf.length > 0 ? (
        <>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Populares
          </p>
          <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
            {popularesEtf.map((a, i) => {
              const dado = acoesEtf?.find((x) => x.ticker === a.ticker);
              return (
                <CartaoAcaoPopular
                  key={a.ticker}
                  acao={a}
                  delay={Math.min(i * 0.04, 0.4)}
                  favorito={favoritos.has(a.ticker)}
                  dadosPre={{
                    preco: dado?.preco ?? null,
                    variacao: dado?.variacao ?? null,
                    logo: dado?.logo ?? null,
                  }}
                  aoComprar={aoComprar}
                  aoVerDetalhe={aoVerDetalhe}
                />
              );
            })}
          </ul>
        </>
      ) : null}

      <ResultadosFundo
        titulo="Outros ETFs da B3"
        termo={buscaFundoAtrasada}
        resultados={resultadosFundo}
        carregando={carregandoFundo}
        erro={erroFundo}
        curados={new Set(ETFS.map((e) => e.ticker))}
        favoritos={favoritos}
        aoComprar={aoComprar}
        aoVerDetalhe={aoVerDetalhe}
      />

      {acoesEtf !== null && popularesEtf.length === 0 && !buscaFundoAtrasada && (
        <p className="mt-8 text-ink-muted">
          Nenhum ETF encontrado com esse termo.
        </p>
      )}
    </>
  );
}
