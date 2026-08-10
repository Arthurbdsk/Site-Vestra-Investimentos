"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { GraficoPreco } from "./GraficoPreco";
import { LogoAcao } from "./LogoAcao";
import { PERIODOS, type Periodo, type PontoSerie } from "@/lib/historico";
import { acaoPorTicker } from "@/lib/acoes";
import { brl, numero } from "@/lib/formato";
import { corDoSetor } from "@/lib/coresSetor";
import { BotaoFavorito } from "./BotaoFavorito";
import { NoticiasDaAcao } from "./NoticiasDaAcao";

type Cabecalho = {
  preco: number | null;
  variacaoDia: number | null;
  setor: string | null;
  logo: string | null;
};

type EstadoGrafico =
  | { fase: "carregando" }
  | { fase: "erro"; mensagem: string }
  | { fase: "feito"; serie: PontoSerie[] };

/**
 * Sinal automatico (nao e opinião de analista humano — brapi nao tem
 * esse dado pra acoes da B3): compara o preco atual com a media do
 * periodo carregado no grafico.
 */
function calcularSinalTecnico(serie: PontoSerie[], precoAtual: number | null) {
  if (serie.length < 5 || precoAtual == null) return null;
  const media = serie.reduce((s, p) => s + p.preco, 0) / serie.length;
  if (media <= 0) return null;
  const difPct = ((precoAtual - media) / media) * 100;
  const direcao: "acima" | "abaixo" | "neutro" =
    difPct > 1.5 ? "acima" : difPct < -1.5 ? "abaixo" : "neutro";
  return { media, difPct, direcao };
}

export function ModalDetalheAcao({
  ticker,
  favorito,
  aoFechar,
  aoComprar,
}: {
  ticker: string | null;
  favorito?: boolean;
  aoFechar: () => void;
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
}) {
  const [cabecalho, setCabecalho] = useState<Cabecalho | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("3mo");
  const [grafico, setGrafico] = useState<EstadoGrafico>({ fase: "carregando" });

  const info = ticker ? acaoPorTicker(ticker) : undefined;

  useEffect(() => {
    if (!ticker) return;
    setCabecalho(null);
    setPeriodo("3mo");
    fetch(`/api/acoes?q=${encodeURIComponent(ticker)}`)
      .then((r) => r.json())
      .then((json) => {
        const a = json.acoes?.find((x: { ticker: string }) => x.ticker === ticker);
        setCabecalho({
          preco: a?.preco ?? null,
          variacaoDia: a?.variacao ?? null,
          setor: a?.setor ?? info?.setor ?? null,
          logo: a?.logo ?? null,
        });
      })
      .catch(() =>
        setCabecalho({ preco: null, variacaoDia: null, setor: info?.setor ?? null, logo: null }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  useEffect(() => {
    if (!ticker) return;
    let cancelado = false;
    setGrafico({ fase: "carregando" });
    fetch(`/api/historico?ticker=${encodeURIComponent(ticker)}&periodo=${periodo}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelado) return;
        if (!json.ok) {
          setGrafico({ fase: "erro", mensagem: json.mensagem ?? "Sem histórico disponível." });
          return;
        }
        setGrafico({ fase: "feito", serie: json.serie ?? [] });
      })
      .catch(() => {
        if (!cancelado) setGrafico({ fase: "erro", mensagem: "Não consegui buscar o histórico." });
      });
    return () => {
      cancelado = true;
    };
  }, [ticker, periodo]);

  return (
    <AnimatePresence>
      {ticker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={aoFechar}
          className="fixed inset-0 z-[65] flex items-end justify-center bg-blue-deep/60 backdrop-blur-sm sm:items-center"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-paper p-7 shadow-2xl"
          >
            <button
              onClick={aoFechar}
              aria-label="Fechar"
              className="absolute right-5 top-5 text-ink-muted transition-colors hover:text-ink"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <LogoAcao logo={cabecalho?.logo ?? null} ticker={ticker} size={40} />
              <div>
            <p
              className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]"
              style={{
                color: cabecalho?.setor ? corDoSetor(cabecalho.setor) : "var(--color-ink-muted)",
              }}
            >
              {cabecalho?.setor ??" "}
            </p>
            <h2 className="flex items-center gap-2 font-display text-3xl text-ink">
              {ticker}
              {ticker && <BotaoFavorito ticker={ticker} favorito={Boolean(favorito)} tamanho={18} />}
            </h2>
              </div>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{info?.nome}</p>

            <div className="mt-4 flex items-baseline gap-3">
              {cabecalho ? (
                cabecalho.preco != null ? (
                  <>
                    <span className="font-mono text-2xl tabular text-ink">
                      {brl(cabecalho.preco)}
                    </span>
                    {cabecalho.variacaoDia != null && (
                      <span
                        className={`font-mono text-sm tabular ${
                          cabecalho.variacaoDia >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {cabecalho.variacaoDia >= 0 ? "▲" : "▼"}{" "}
                        {numero(Math.abs(cabecalho.variacaoDia))}% hoje
                      </span>
                    )}
                  </>
                ) : (
                  <span className="font-mono text-sm text-ink-muted">preço indisponível</span>
                )
              ) : (
                <Loader2 size={16} className="animate-spin text-ink-muted" />
              )}
            </div>

            {info && (
              <p className="mt-4 border-l-[3px] border-gold pl-4 text-sm leading-relaxed text-ink-muted">
                {info.explica}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-1.5">
              {PERIODOS.map((p) => (
                <button
                  key={p.valor}
                  onClick={() => setPeriodo(p.valor)}
                  className={`border px-3 py-1.5 font-mono text-xs transition-colors ${
                    periodo === p.valor
                      ? "border-blue bg-blue text-onblue"
                      : "border-[var(--rule)] text-ink-muted hover:border-blue hover:text-blue"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mt-5 min-h-[180px]">
              {grafico.fase === "carregando" && (
                <div className="flex h-[180px] items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-ink-muted" />
                </div>
              )}
              {grafico.fase === "erro" && (
                <p className="flex items-start gap-2 text-sm text-ink-muted">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {grafico.mensagem}
                </p>
              )}
              {grafico.fase === "feito" && <GraficoPreco serie={grafico.serie} />}
            </div>

            {grafico.fase === "feito" && (
              <SinalTecnico
                serie={grafico.serie}
                precoAtual={cabecalho?.preco ?? null}
                periodoLabel={PERIODOS.find((p) => p.valor === periodo)?.label ?? periodo}
              />
            )}

            <NoticiasDaAcao nome={info?.nome ?? ticker} />

            <button
              onClick={() => cabecalho?.preco != null && aoComprar(ticker, cabecalho.preco, info?.nome)}
              disabled={!cabecalho?.preco}
              className="mt-6 w-full bg-blue px-6 py-3.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50"
            >
              Comprar {ticker}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SinalTecnico({
  serie,
  precoAtual,
  periodoLabel,
}: {
  serie: PontoSerie[];
  precoAtual: number | null;
  periodoLabel: string;
}) {
  const sinal = calcularSinalTecnico(serie, precoAtual);
  if (!sinal) return null;

  const { media, difPct, direcao } = sinal;
  const Icone = direcao === "acima" ? TrendingUp : direcao === "abaixo" ? TrendingDown : Minus;
  const cor =
    direcao === "acima" ? "text-emerald-600" : direcao === "abaixo" ? "text-rose-600" : "text-ink-muted";
  const texto =
    direcao === "acima"
      ? "acima da média do período"
      : direcao === "abaixo"
        ? "abaixo da média do período"
        : "perto da média do período";

  return (
    <div className="mt-6 border-l-[3px] border-[var(--rule)] pl-4">
      <p className="flex items-center gap-2 text-sm">
        <Icone size={15} className={`shrink-0 ${cor}`} />
        <span className="text-ink">
          Preço atual está <strong className={cor}>{numero(Math.abs(difPct))}% {texto}</strong>{" "}
          ({periodoLabel})
        </span>
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Média do período: {brl(media)}. Sinal automático calculado a partir do
        preço histórico — não é opinião de analista humano nem recomendação de compra ou venda.
      </p>
    </div>
  );
}
