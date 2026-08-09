"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import { GraficoPreco } from "./GraficoPreco";
import { LogoAcao } from "./LogoAcao";
import { PERIODOS, type Periodo, type PontoSerie } from "@/lib/historico";
import { acaoPorTicker } from "@/lib/acoes";
import { brl, numero } from "@/lib/formato";
import { corDoSetor } from "@/lib/coresSetor";

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

export function ModalDetalheAcao({
  ticker,
  aoFechar,
  aoComprar,
}: {
  ticker: string | null;
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
            <h2 className="font-display text-3xl text-ink">{ticker}</h2>
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
