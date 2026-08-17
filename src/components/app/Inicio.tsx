"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { brl, pct } from "@/lib/formato";
import { AvisoSimulacaoLinha } from "../AvisoSimulacao";

export type PontoPatrimonio = { data: string; valor: number };

export function Inicio({
  apelido,
  saudacao,
  saldo,
  investido,
  lucro,
  lucroPct,
  patrimonio,
  historico,
  melhorPosicao,
  aoExplorar,
}: {
  apelido: string;
  /** Vem pronta do servidor (que roda em Sao Paulo). Se fosse calculada
   * aqui, o horario do servidor e o do navegador podiam discordar. */
  saudacao: string;
  saldo: number;
  investido: number;
  lucro: number;
  lucroPct: number;
  patrimonio: number;
  historico: PontoPatrimonio[];
  melhorPosicao: { ticker: string; retornoPct: number } | null;
  aoExplorar: () => void;
}) {
  const variacaoJanela = useMemo(() => {
    if (historico.length < 2) return null;
    const inicio = historico[0].valor;
    if (inicio === 0) return null;
    return ((historico[historico.length - 1].valor - inicio) / inicio) * 100;
  }, [historico]);

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          {saudacao}
        </p>
        <h1 className="mt-1 font-display text-3xl leading-tight text-ink">
          {apelido}
        </h1>
      </header>

      <section className="border border-[var(--rule)]">
        <div className="border-b border-[var(--rule)] px-5 py-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            Patrimônio virtual
          </p>
          <p className="mt-1.5 font-mono text-4xl tabular text-ink">
            {brl(patrimonio)}
          </p>
          {variacaoJanela != null && (
            <Variacao valor={variacaoJanela} className="mt-2" />
          )}
          <AvisoSimulacaoLinha className="mt-3" />
        </div>

        <GraficoEvolucao serie={historico} />
      </section>

      <section className="grid grid-cols-2 gap-px bg-[var(--rule)] lg:grid-cols-4">
        <Cartao rotulo="Saldo disponível" valor={brl(saldo)} />
        <Cartao rotulo="Investido" valor={brl(investido)} />
        <Cartao
          rotulo="Resultado total"
          valor={`${lucro >= 0 ? "+" : ""}${brl(lucro)}`}
          cor={lucro > 0 ? "positivo" : lucro < 0 ? "negativo" : "neutro"}
          nota={investido > 0 ? pct(lucroPct) : undefined}
        />
        <Cartao
          rotulo="Melhor posição"
          valor={melhorPosicao ? melhorPosicao.ticker : "sem posição"}
          cor={
            melhorPosicao
              ? melhorPosicao.retornoPct >= 0
                ? "positivo"
                : "negativo"
              : "neutro"
          }
          nota={
            melhorPosicao ? pct(melhorPosicao.retornoPct) : "compre pra começar"
          }
        />
      </section>

      {investido === 0 && (
        <section className="border-l-[3px] border-gold bg-paper-alt px-5 py-5">
          <p className="font-display text-xl text-ink">
            Sua carteira ainda está vazia.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Você tem {brl(saldo)} virtuais parados. Escolha uma empresa, compre
            uma cota e acompanhe o que acontece. Não custa nada errar aqui.
          </p>
          <button
            onClick={aoExplorar}
            className="mt-4 bg-blue px-5 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
          >
            Ver o mercado
          </button>
        </section>
      )}
    </div>
  );
}

function Cartao({
  rotulo,
  valor,
  nota,
  cor = "neutro",
}: {
  rotulo: string;
  valor: string;
  nota?: string;
  cor?: "positivo" | "negativo" | "neutro";
}) {
  const classeCor =
    cor === "positivo"
      ? "text-emerald-600 dark:text-emerald-400"
      : cor === "negativo"
        ? "text-rose-600 dark:text-rose-400"
        : "text-ink";

  return (
    <div className="bg-paper px-4 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        {rotulo}
      </p>
      <p className={`mt-1.5 font-mono text-lg tabular ${classeCor}`}>{valor}</p>
      {nota && (
        <p className="mt-0.5 font-mono text-[11px] tabular text-ink-muted">
          {nota}
        </p>
      )}
    </div>
  );
}

/** Variacao sempre com sinal, seta E texto: cor sozinha nao pode ser a
 * unica pista, senao quem nao distingue verde de vermelho perde a
 * informacao inteira. */
function Variacao({ valor, className = "" }: { valor: number; className?: string }) {
  const positivo = valor > 0;
  const negativo = valor < 0;
  const Icone = positivo ? TrendingUp : negativo ? TrendingDown : Minus;
  const cor = positivo
    ? "text-emerald-600 dark:text-emerald-400"
    : negativo
      ? "text-rose-600 dark:text-rose-400"
      : "text-ink-muted";

  return (
    <p className={`flex items-center gap-1.5 font-mono text-sm tabular ${cor} ${className}`}>
      <Icone size={14} aria-hidden />
      {/* pct() ja devolve o sinal; nao repetir aqui. */}
      {pct(valor)}
      <span className="text-ink-muted">no período</span>
    </p>
  );
}

function GraficoEvolucao({ serie }: { serie: PontoPatrimonio[] }) {
  if (serie.length < 2) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          Histórico em construção
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
          A curva aparece quando houver pelo menos dois dias registrados. A
          gente guarda uma marcação do seu patrimônio por dia, então volte
          amanhã pra ver o primeiro traço.
        </p>
      </div>
    );
  }

  const largura = 700;
  const altura = 180;
  const valores = serie.map((p) => p.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const amplitude = max - min || 1;

  const pontos = serie.map((p, i) => {
    const x = (i / (serie.length - 1)) * largura;
    const y = altura - ((p.valor - min) / amplitude) * (altura - 16) - 8;
    return { x, y };
  });

  const linha = pontos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${linha} ${largura},${altura} 0,${altura}`;
  const subiu = valores[valores.length - 1] >= valores[0];
  const cor = subiu ? "var(--color-teal-texto)" : "var(--color-coral-texto)";

  return (
    <div className="px-1 py-3">
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        className="h-44 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Evolução do patrimônio virtual, de ${brl(valores[0])} a ${brl(valores[valores.length - 1])}.`}
      >
        {/* SVG puro de proposito: envolver geometria (points, pathLength)
            em componente do framer ja quebrou grafico neste projeto antes,
            entao a animacao fica no CSS e a geometria fica estatica. */}
        <polygon points={area} fill={cor} opacity={0.1} />
        <polyline
          points={linha}
          fill="none"
          stroke={cor}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="traco-evolucao"
        />
      </svg>
    </div>
  );
}
