"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { ACOES } from "@/lib/acoes";
import { PERIODOS, type Periodo } from "@/lib/historico";
import { brl, numero, pct, data as fmtData } from "@/lib/formato";

type Estado =
  | { fase: "formulario" }
  | { fase: "carregando" }
  | { fase: "erro"; mensagem: string }
  | {
      fase: "feito";
      ticker: string;
      nome: string;
      precoAntigo: number;
      dataAntiga: string;
      precoAtual: number;
      dataAtual: string;
    };

export function SeTivesseInvestido() {
  const [ticker, setTicker] = useState(ACOES[0].ticker);
  const [tickerLivre, setTickerLivre] = useState("");
  const [periodo, setPeriodo] = useState<Periodo>("1y");
  const [valor, setValor] = useState(1000);
  const [estado, setEstado] = useState<Estado>({ fase: "formulario" });

  const tickerEscolhido = (tickerLivre.trim() || ticker).toUpperCase();

  async function calcular() {
    setEstado({ fase: "carregando" });
    try {
      const resposta = await fetch(
        `/api/historico?ticker=${encodeURIComponent(tickerEscolhido)}&periodo=${periodo}`,
      );
      const json = await resposta.json();
      if (!resposta.ok) {
        setEstado({
          fase: "erro",
          mensagem: json.mensagem ?? "Não consegui calcular agora. Tente de novo.",
        });
        return;
      }
      setEstado({
        fase: "feito",
        ticker: json.ticker,
        nome: json.nome,
        precoAntigo: json.precoAntigo,
        dataAntiga: json.dataAntiga,
        precoAtual: json.precoAtual,
        dataAtual: json.dataAtual,
      });
    } catch {
      setEstado({
        fase: "erro",
        mensagem: "Não consegui calcular agora. Tente de novo.",
      });
    }
  }

  const resultado =
    estado.fase === "feito"
      ? (() => {
          const cotas = valor / estado.precoAntigo;
          const valorHoje = cotas * estado.precoAtual;
          const ganho = valorHoje - valor;
          const ganhoPct = (ganho / valor) * 100;
          return { cotas, valorHoje, ganho, ganhoPct };
        })()
      : null;

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">
        E se você tivesse investido antes?
      </h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Escolha uma ação, um período no passado e quanto você imagina ter
        investido. A gente calcula o que esse dinheiro valeria hoje, com
        preços reais da B3.
      </p>

      <div className="mt-8 grid gap-5 border border-[var(--rule)] bg-paper-alt p-6 sm:grid-cols-2">
        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Ação (populares)
          </label>
          <select
            value={ticker}
            onChange={(e) => {
              setTicker(e.target.value);
              setTickerLivre("");
            }}
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors focus:border-blue"
          >
            {ACOES.map((a) => (
              <option key={a.ticker} value={a.ticker}>
                {a.ticker} — {a.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Ou qualquer código da B3
          </label>
          <input
            value={tickerLivre}
            onChange={(e) => setTickerLivre(e.target.value)}
            placeholder="ex: TOTS3"
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-blue"
          />
        </div>

        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Há quanto tempo
          </label>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as Periodo)}
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors focus:border-blue"
          >
            {PERIODOS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Quanto você teria investido
          </label>
          <input
            type="number"
            min={1}
            value={valor}
            onChange={(e) => setValor(Math.max(1, Number(e.target.value) || 1))}
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors focus:border-blue"
          />
        </div>

        <button
          onClick={calcular}
          disabled={estado.fase === "carregando"}
          className="flex items-center justify-center gap-2 bg-blue px-6 py-3.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50 sm:col-span-2"
        >
          {estado.fase === "carregando" ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Calculando
            </>
          ) : (
            "Calcular"
          )}
        </button>
      </div>

      {estado.fase === "erro" && (
        <p className="mt-6 flex items-start gap-2 border-l-[3px] border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {estado.mensagem}
        </p>
      )}

      {estado.fase === "feito" && resultado && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 border border-[var(--rule)] p-6"
        >
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-blue" />
            <p className="font-display text-xl text-ink">
              {estado.ticker} — {estado.nome}
            </p>
          </div>

          <p className="mt-4 leading-relaxed text-ink">
            Em {fmtData(estado.dataAntiga)}, {brl(valor)} comprava{" "}
            {numero(resultado.cotas, 2)} cotas a {brl(estado.precoAntigo)} cada.
            Hoje ({fmtData(estado.dataAtual)}), a {brl(estado.precoAtual)} a
            cota, isso valeria:
          </p>

          <p className="mt-4 font-mono text-3xl tabular text-blue">
            {brl(resultado.valorHoje)}
          </p>

          <p
            className={`mt-1 font-mono text-sm tabular ${
              resultado.ganho >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {resultado.ganho >= 0 ? "+" : ""}
            {brl(resultado.ganho)} ({pct(resultado.ganhoPct)})
          </p>

          <p className="mt-4 font-mono text-[11px] text-ink-muted">
            Simulação com preços históricos reais. Não considera dividendos,
            taxas ou imposto de renda.
          </p>
        </motion.div>
      )}
    </div>
  );
}
