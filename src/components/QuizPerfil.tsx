"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, RotateCcw } from "lucide-react";
import { PERGUNTAS, calcularPerfil, type Perfil } from "@/lib/perfilInvestidor";
import { acaoPorTicker } from "@/lib/acoes";

export function QuizPerfil() {
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [resultado, setResultado] = useState<Perfil | null>(null);

  function responder(pontos: number) {
    const pergunta = PERGUNTAS[passo];
    const novasRespostas = { ...respostas, [pergunta.id]: pontos };
    setRespostas(novasRespostas);

    if (passo + 1 < PERGUNTAS.length) {
      setPasso(passo + 1);
    } else {
      setResultado(calcularPerfil(novasRespostas));
    }
  }

  function recomecar() {
    setPasso(0);
    setRespostas({});
    setResultado(null);
  }

  if (resultado) {
    return (
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-gold-soft">
          Seu perfil é
        </p>
        <h2 className="mt-1 font-display text-4xl font-bold text-blue">{resultado.nome}</h2>
        <p className="mt-4 max-w-xl border-l-[3px] border-gold pl-5 leading-relaxed text-ink-muted">
          {resultado.descricao}
        </p>

        <p className="mt-10 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          Empresas que combinam com esse perfil
        </p>
        <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
          {resultado.tickers.map((ticker, i) => {
            const info = acaoPorTicker(ticker);
            if (!info) return null;
            return (
              <motion.li
                key={ticker}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-paper p-5"
              >
                <p className="font-mono text-sm font-semibold text-ink">{ticker}</p>
                <p className="text-sm text-ink">{info.nome}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {info.explica}
                </p>
              </motion.li>
            );
          })}
        </ul>

        <p className="mt-6 font-mono text-[11px] text-ink-muted">
          Sugestão educativa, não recomendação de investimento. O perfil não
          muda o fato de que qualquer ação pode subir ou cair.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/simulador"
            className="group inline-flex items-center gap-2 bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
          >
            Testar essas empresas no simulador
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <button
            onClick={recomecar}
            className="inline-flex items-center gap-2 border border-[var(--rule)] px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-blue hover:text-blue"
          >
            <RotateCcw size={15} />
            Refazer o quiz
          </button>
        </div>
      </div>
    );
  }

  const pergunta = PERGUNTAS[passo];

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Descubra seu perfil de investidor</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        {PERGUNTAS.length} perguntas rápidas pra entender que tipo de risco
        combina com você, e sugerir empresas nessa linha.
      </p>

      <div className="mt-8 flex items-center gap-2">
        {PERGUNTAS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 ${i <= passo ? "bg-gold" : "bg-[var(--rule)]"}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={pergunta.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mt-8"
        >
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Pergunta {passo + 1} de {PERGUNTAS.length}
          </p>
          <p className="mt-2 font-display text-xl text-ink">{pergunta.texto}</p>

          <div className="mt-6 space-y-3">
            {pergunta.opcoes.map((op) => (
              <button
                key={op.texto}
                onClick={() => responder(op.pontos)}
                className="block w-full border border-[var(--rule)] px-5 py-4 text-left text-sm leading-relaxed text-ink transition-colors hover:border-blue hover:bg-paper-alt"
              >
                {op.texto}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
