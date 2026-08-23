"use client";

import { Loader2 } from "lucide-react";
import { CartaoAcaoPopular, ResultadosFundo } from "./ExplorarCartoes";
import { FIIS } from "@/lib/fiis";
import type { AcaoB3 } from "@/lib/buscaAcoes";

/** Aba "FII" do Explorar: fundos imobiliarios. Extraida de PainelSimulador.tsx. */
export function ExplorarFii({
  busca,
  setBusca,
  acoesFii,
  popularesFii,
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
  acoesFii: AcaoB3[] | null;
  popularesFii: { ticker: string; nome: string; setor: string; explica: string }[];
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
        Escolha um Fundo Imobiliário
      </h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        FIIs são negociados na B3 igual uma ação (ticker termina em 11),
        mas o dinheiro vai pra imóveis ou títulos imobiliários, não pra
        uma empresa. Costumam pagar rendimento todo mês. Explicamos
        alguns conhecidos, mas busque qualquer código pra comprar
        qualquer um dos mais de 300 FIIs da bolsa.
      </p>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome, código ou tipo (ex: logística, shopping)"
        className="mt-6 w-full max-w-sm border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-blue"
      />

      {acoesFii === null ? (
        <div className="mt-6 flex items-center gap-2 text-ink-muted">
          <Loader2 size={16} className="animate-spin" />
          Carregando FIIs…
        </div>
      ) : popularesFii.length > 0 ? (
        <>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Populares
          </p>
          <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
            {popularesFii.map((a, i) => {
              const dado = acoesFii?.find((x) => x.ticker === a.ticker);
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
        titulo="Outros FIIs da B3"
        termo={buscaFundoAtrasada}
        resultados={resultadosFundo}
        carregando={carregandoFundo}
        erro={erroFundo}
        curados={new Set(FIIS.map((f) => f.ticker))}
        favoritos={favoritos}
        aoComprar={aoComprar}
        aoVerDetalhe={aoVerDetalhe}
      />

      {acoesFii !== null && popularesFii.length === 0 && !buscaFundoAtrasada && (
        <p className="mt-8 text-ink-muted">
          Nenhum FII encontrado com esse termo.
        </p>
      )}
    </>
  );
}
