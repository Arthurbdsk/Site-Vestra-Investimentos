"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { LogoAcao } from "./LogoAcao";
import { MiniGraficoAcao } from "./MiniGraficoAcao";
import { BotaoFavorito } from "./BotaoFavorito";
import { fiiPorTicker } from "@/lib/fiis";
import { etfPorTicker } from "@/lib/etfs";
import type { Acao } from "@/lib/acoes";
import type { AcaoB3 } from "@/lib/buscaAcoes";
import { corDoSetor } from "@/lib/coresSetor";
import { brl, numero } from "@/lib/formato";

/**
 * Cartoes de acao/fundo compartilhados pelas quatro abas do Explorar
 * (BR, FII, ETF, US) dentro de PainelSimulador.tsx. Extraidos daqui pra
 * nao duplicar a mesma marcacao quatro vezes.
 */

export function CartaoAcaoPopular({
  acao,
  delay,
  favorito,
  dadosPre,
  aoComprar,
  aoVerDetalhe,
}: {
  acao: Acao;
  delay: number;
  favorito?: boolean;
  /** Quando informado, pula a busca propria (usado pras acoes americanas, ja buscadas de uma vez pelo componente pai). */
  dadosPre?: { preco: number | null; variacao: number | null; logo: string | null };
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
  aoVerDetalhe: (ticker: string) => void;
}) {
  const [dados, setDados] = useState<{ preco: number; variacao: number; logo: string | null } | null>(null);

  useEffect(() => {
    if (dadosPre) return;
    let cancelado = false;
    fetch(`/api/acoes?q=${encodeURIComponent(acao.ticker)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelado || !json.acoes) return;
        const encontrada = json.acoes.find(
          (a: AcaoB3) => a.ticker === acao.ticker,
        );
        if (encontrada?.preco != null) {
          setDados({ preco: encontrada.preco, variacao: encontrada.variacao ?? 0, logo: encontrada.logo ?? null });
        }
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [acao.ticker, dadosPre]);

  const dadosFinais = dadosPre
    ? dadosPre.preco != null
      ? { preco: dadosPre.preco, variacao: dadosPre.variacao ?? 0, logo: dadosPre.logo }
      : null
    : dados;
  const semDadosDisponiveis = Boolean(dadosPre) && dadosPre!.preco == null;

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-paper p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <button onClick={() => aoVerDetalhe(acao.ticker)} className="flex items-start gap-3 text-left">
          <LogoAcao logo={dadosFinais?.logo ?? null} ticker={acao.ticker} />
          <div>
            <p className="font-mono text-sm font-semibold text-ink underline decoration-transparent underline-offset-4 transition-colors hover:text-blue hover:decoration-blue">
              {acao.ticker}
            </p>
            <p className="text-sm text-ink">{acao.nome}</p>
            <p
              className="font-mono text-[11px] font-medium uppercase tracking-wider"
              style={{ color: corDoSetor(acao.setor) }}
            >
              {acao.setor}
            </p>
          </div>
        </button>

        <div className="flex items-start gap-3">
          <div className="text-right">
            {dadosFinais ? (
              <>
                <p className="font-mono text-lg tabular text-ink">{brl(dadosFinais.preco)}</p>
                <p
                  className={`font-mono text-xs tabular ${
                    dadosFinais.variacao >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {dadosFinais.variacao >= 0 ? "▲" : "▼"} {numero(Math.abs(dadosFinais.variacao))}%
                </p>
              </>
            ) : semDadosDisponiveis ? (
              <p className="font-mono text-xs text-ink-muted">indisponível</p>
            ) : (
              <p className="font-mono text-xs text-ink-muted">carregando…</p>
            )}
          </div>
          <BotaoFavorito ticker={acao.ticker} favorito={Boolean(favorito)} />
        </div>
      </div>

      {!dadosPre && (
        <div className="mt-3 flex justify-end">
          <MiniGraficoAcao ticker={acao.ticker} />
        </div>
      )}

      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{acao.explica}</p>

      <button
        onClick={() => dadosFinais && aoComprar(acao.ticker, dadosFinais.preco, acao.nome)}
        disabled={!dadosFinais}
        className="mt-4 w-full bg-blue px-5 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-40"
      >
        {dadosFinais ? "Comprar" : "Indisponível agora"}
      </button>
    </motion.li>
  );
}

/**
 * Resultados da busca no catalogo completo de fundos da B3.
 *
 * Os curados aparecem acima em "Populares", com explicacao propria, e sao
 * removidos daqui pra a mesma cota nao sair duas vezes na tela.
 */
export function ResultadosFundo({
  titulo,
  termo,
  resultados,
  carregando,
  erro,
  curados,
  favoritos,
  aoComprar,
  aoVerDetalhe,
}: {
  titulo: string;
  termo: string;
  resultados: AcaoB3[];
  carregando: boolean;
  erro: string | null;
  curados: Set<string>;
  favoritos: Set<string>;
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
  aoVerDetalhe: (ticker: string) => void;
}) {
  if (termo.length < 2) return null;

  const novos = resultados.filter((a) => !curados.has(a.ticker));

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          {titulo}
        </p>
        {carregando && <Loader2 size={13} className="animate-spin text-ink-muted" />}
      </div>

      {erro && <p className="mt-4 text-sm text-ink-muted">{erro}</p>}

      {!erro && !carregando && novos.length === 0 && (
        <p className="mt-4 text-ink-muted">Nada mais encontrado com esse termo.</p>
      )}

      {!erro && novos.length > 0 && (
        <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
          {novos.map((a, i) => (
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
  );
}

export function CartaoAcaoB3({
  acao,
  delay,
  favorito,
  aoComprar,
  aoVerDetalhe,
}: {
  acao: AcaoB3;
  delay: number;
  favorito?: boolean;
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
  aoVerDetalhe: (ticker: string) => void;
}) {
  const disponivel = acao.preco != null;

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-paper p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <button onClick={() => aoVerDetalhe(acao.ticker)} className="flex items-start gap-3 text-left">
          <LogoAcao logo={acao.logo} ticker={acao.ticker} />
          <div>
            <p className="font-mono text-sm font-semibold text-ink underline decoration-transparent underline-offset-4 transition-colors hover:text-blue hover:decoration-blue">
              {acao.ticker}
            </p>
            <p className="text-sm text-ink">{acao.nome}</p>
            {acao.setor && (
              <p
                className="font-mono text-[11px] font-medium uppercase tracking-wider"
                style={{ color: corDoSetor(acao.setor) }}
              >
                {acao.setor}
              </p>
            )}
          </div>
        </button>

        <div className="flex items-start gap-3">
          <div className="text-right">
            {disponivel ? (
              <>
                <p className="font-mono text-lg tabular text-ink">{brl(acao.preco!)}</p>
                {acao.variacao != null && (
                  <p
                    className={`font-mono text-xs tabular ${
                      acao.variacao >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {acao.variacao >= 0 ? "▲" : "▼"} {numero(Math.abs(acao.variacao))}%
                  </p>
                )}
              </>
            ) : (
              <p className="font-mono text-xs text-ink-muted">preço indisponível</p>
            )}
          </div>
          <BotaoFavorito ticker={acao.ticker} favorito={Boolean(favorito)} />
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <MiniGraficoAcao ticker={acao.ticker} />
      </div>

      <button
        onClick={() => disponivel && aoComprar(acao.ticker, acao.preco!, acao.nome)}
        disabled={!disponivel}
        className="mt-4 w-full border border-blue px-5 py-2.5 text-sm font-semibold text-blue transition-colors hover:bg-blue hover:text-onblue disabled:opacity-40"
      >
        {disponivel ? "Comprar" : "Indisponível agora"}
      </button>
    </motion.li>
  );
}

/** Suas acoes favoritadas, buscando a cotacao de cada uma individualmente. */
export function FavoritasFaixa({
  tickers,
  aoComprar,
  aoVerDetalhe,
}: {
  tickers: string[];
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
  aoVerDetalhe: (ticker: string) => void;
}) {
  const [acoes, setAcoes] = useState<AcaoB3[]>([]);

  useEffect(() => {
    let cancelado = false;
    // Cada favorito vai pra rota que cobre o mercado dele. Antes tudo ia
    // pra /api/acoes (type=stock na brapi, so B3), entao favoritar um
    // FII, um ETF ou uma acao americana acendia a estrela mas o ativo
    // nunca aparecia nesta faixa, sem aviso nenhum.
    function rotaDe(t: string) {
      if (fiiPorTicker(t)) return "/api/fiis";
      if (etfPorTicker(t)) return "/api/etfs";
      if (/^[A-Z]{1,5}$/.test(t)) return `/api/acoes-usa?q=${encodeURIComponent(t)}`;
      return `/api/acoes?q=${encodeURIComponent(t)}`;
    }

    Promise.all(
      tickers.map((t) =>
        fetch(rotaDe(t))
          .then((r) => r.json())
          .then((json) => json.acoes?.find((a: AcaoB3) => a.ticker === t) ?? null)
          .catch(() => null),
      ),
    ).then((resultados) => {
      if (!cancelado) setAcoes(resultados.filter((a): a is AcaoB3 => a != null));
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickers.join(",")]);

  if (acoes.length === 0) return null;

  return (
    <>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
        Suas favoritas
      </p>
      <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
        {acoes.map((a, i) => (
          <CartaoAcaoB3
            key={a.ticker}
            acao={a}
            delay={Math.min(i * 0.04, 0.4)}
            favorito
            aoComprar={aoComprar}
            aoVerDetalhe={aoVerDetalhe}
          />
        ))}
      </ul>
    </>
  );
}
