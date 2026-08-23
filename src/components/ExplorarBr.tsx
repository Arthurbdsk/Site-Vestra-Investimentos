"use client";

import { Loader2 } from "lucide-react";
import { TabelaAcoes } from "./TabelaAcoes";
import { CartaoAcaoPopular, CartaoAcaoB3, FavoritasFaixa } from "./ExplorarCartoes";
import type { Acao } from "@/lib/acoes";
import type { AcaoB3 } from "@/lib/buscaAcoes";

/** Aba "BR" do Explorar: acoes da B3. Extraida de PainelSimulador.tsx. */
export function ExplorarBr({
  busca,
  setBusca,
  termoBuscado,
  populares,
  restoB3,
  carregando,
  erroB3,
  visao,
  setVisao,
  favoritos,
  aoComprar,
  aoVerDetalhe,
}: {
  busca: string;
  setBusca: (v: string) => void;
  /** Termo em minusculo, sem espaco nas pontas, usado pra decidir textos e a faixa de favoritas. */
  termoBuscado: string;
  populares: Acao[];
  restoB3: AcaoB3[];
  carregando: boolean;
  erroB3: string | null;
  visao: "cards" | "tabela";
  setVisao: (v: "cards" | "tabela") => void;
  favoritos: Set<string>;
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
  aoVerDetalhe: (ticker: string) => void;
}) {
  return (
    <>
      <h2 className="mt-4 font-display text-2xl text-ink">
        Escolha uma ação da B3
      </h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Destacamos algumas empresas conhecidas com explicação em português,
        mas a bolsa é sua: busque qualquer código ou nome pra comprar
        qualquer ação da B3.
      </p>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome, código ou setor"
        className="mt-6 w-full max-w-sm border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-blue"
      />

      {favoritos.size > 0 && !termoBuscado && (
        <FavoritasFaixa
          tickers={[...favoritos]}
          aoComprar={aoComprar}
          aoVerDetalhe={aoVerDetalhe}
        />
      )}

      {populares.length > 0 && (
        <>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Populares
          </p>
          <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
            {populares.map((a, i) => (
              <CartaoAcaoPopular
                key={a.ticker}
                acao={a}
                delay={Math.min(i * 0.04, 0.4)}
                favorito={favoritos.has(a.ticker)}
                aoComprar={aoComprar}
                aoVerDetalhe={aoVerDetalhe}
              />
            ))}
          </ul>
        </>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            {termoBuscado ? "Resultados na B3" : "Mais ações da B3"}
          </p>
          {carregando && <Loader2 size={13} className="animate-spin text-ink-muted" />}
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => setVisao("cards")}
            className={`px-3 py-1.5 font-mono text-xs transition-colors ${
              visao === "cards"
                ? "bg-blue text-onblue"
                : "border border-[var(--rule)] text-ink-muted hover:border-blue hover:text-blue"
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setVisao("tabela")}
            className={`px-3 py-1.5 font-mono text-xs transition-colors ${
              visao === "tabela"
                ? "bg-blue text-onblue"
                : "border border-[var(--rule)] text-ink-muted hover:border-blue hover:text-blue"
            }`}
          >
            Tabela
          </button>
        </div>
      </div>

      {erroB3 && (
        <p className="mt-4 text-sm text-ink-muted">{erroB3}</p>
      )}

      {!erroB3 && visao === "cards" && (
        <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
          {restoB3.map((a, i) => (
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

      {!erroB3 && visao === "tabela" && restoB3.length > 0 && (
        <div className="mt-3">
          <TabelaAcoes acoes={restoB3} favoritos={favoritos} aoVerDetalhe={aoVerDetalhe} aoComprar={aoComprar} />
        </div>
      )}

      {!carregando && !erroB3 && populares.length === 0 && restoB3.length === 0 && (
        <p className="mt-8 text-ink-muted">
          Nenhuma ação encontrada com esse termo.
        </p>
      )}
    </>
  );
}
