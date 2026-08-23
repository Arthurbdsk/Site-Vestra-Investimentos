"use client";

import { Loader2 } from "lucide-react";
import { CartaoAcaoPopular, CartaoAcaoB3 } from "./ExplorarCartoes";
import { ACOES_USA } from "@/lib/acoesUsa";
import type { AcaoB3 } from "@/lib/buscaAcoes";

/** Aba "US" do Explorar: acoes americanas. Extraida de PainelSimulador.tsx. */
export function ExplorarUs({
  buscaUsa,
  setBuscaUsa,
  acoesUsa,
  buscaUsaAtrasada,
  resultadosBuscaUsa,
  carregandoUsa,
  erroUsa,
  favoritos,
  aoComprar,
  aoVerDetalhe,
}: {
  buscaUsa: string;
  setBuscaUsa: (v: string) => void;
  acoesUsa: AcaoB3[] | null;
  buscaUsaAtrasada: string;
  resultadosBuscaUsa: AcaoB3[];
  carregandoUsa: boolean;
  erroUsa: string | null;
  favoritos: Set<string>;
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
  aoVerDetalhe: (ticker: string) => void;
}) {
  return (
    <>
      <h2 className="mt-4 font-display text-2xl text-ink">
        Escolha uma ação dos EUA
      </h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Destacamos algumas empresas conhecidas, mas a NYSE/NASDAQ inteira
        é sua: busque qualquer ticker ou nome. Preço já convertido pra
        reais.
      </p>

      <input
        value={buscaUsa}
        onChange={(e) => setBuscaUsa(e.target.value)}
        placeholder="Buscar por nome ou ticker (ex: Netflix, GOOG)"
        className="mt-6 w-full max-w-sm border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-blue"
      />

      {!buscaUsaAtrasada && (
        <>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Populares
          </p>
          {acoesUsa === null ? (
            <div className="mt-6 flex items-center gap-2 text-ink-muted">
              <Loader2 size={16} className="animate-spin" />
              Carregando ações americanas…
            </div>
          ) : (
            <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
              {ACOES_USA.map((a, i) => {
                const dado = acoesUsa.find((x) => x.ticker === a.ticker);
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
          )}
        </>
      )}

      {buscaUsaAtrasada && (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
              Resultados
            </p>
            {carregandoUsa && <Loader2 size={13} className="animate-spin text-ink-muted" />}
          </div>

          {erroUsa && <p className="mt-4 text-sm text-ink-muted">{erroUsa}</p>}

          {!erroUsa && !carregandoUsa && resultadosBuscaUsa.length === 0 && (
            <p className="mt-4 text-ink-muted">Nenhuma ação encontrada com esse termo.</p>
          )}

          {!erroUsa && resultadosBuscaUsa.length > 0 && (
            <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
              {resultadosBuscaUsa.map((a, i) => (
                <CartaoAcaoB3
                  key={a.ticker}
                  acao={a}
                  delay={Math.min(i * 0.04, 0.4)}
                  favorito={favoritos.has(a.ticker)}
                  aoComprar={aoComprar}
                  aoVerDetalhe={aoVerDetalhe}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
