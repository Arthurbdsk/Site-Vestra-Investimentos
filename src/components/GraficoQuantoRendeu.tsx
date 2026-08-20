import { brl } from "@/lib/formato";

/**
 * Curva do VALOR DA POSICAO ao longo da janela, nao do preco da cota.
 *
 * A pergunta da pagina e "quanto os meus R$X viraram", entao o eixo tem
 * que estar em reais investidos; mostrar preco unitario obrigaria o leitor
 * a fazer a multiplicacao de cabeca. A linha tracejada e o valor aplicado,
 * pra dar a referencia de onde comecou.
 *
 * SVG puro, sem biblioteca: e uma linha e duas retas, e a pagina e
 * server-rendered (nao ha interacao aqui).
 */
export function GraficoQuantoRendeu({
  serie,
  cotas,
  investido,
}: {
  serie: { data: string; preco: number }[];
  cotas: number;
  investido: number;
}) {
  const pontos = serie.filter((p) => Number.isFinite(p.preco) && p.preco > 0);
  if (pontos.length < 2) return null;

  const L = 700;
  const A = 200;

  const valores = pontos.map((p) => p.preco * cotas);
  const min = Math.min(...valores, investido);
  const max = Math.max(...valores, investido);
  const amplitude = max - min || 1;

  const x = (i: number) => (i / (pontos.length - 1)) * L;
  const y = (v: number) => A - ((v - min) / amplitude) * (A - 20) - 10;

  const linha = valores
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const area = `${linha} L${L},${A} L0,${A} Z`;
  const yInvestido = y(investido);

  const subiu = valores[valores.length - 1] >= investido;
  const cor = subiu ? "var(--color-teal-texto)" : "var(--color-coral-texto)";

  return (
    <div className="px-2 py-4">
      <svg
        viewBox={`0 0 ${L} ${A}`}
        className="h-48 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Evolução do valor da posição, de ${brl(valores[0])} a ${brl(valores[valores.length - 1])}.`}
      >
        <path d={area} fill={cor} opacity={0.1} />
        {/* Referencia do valor aplicado: acima dela e ganho, abaixo e perda. */}
        <line
          x1={0}
          y1={yInvestido}
          x2={L}
          y2={yInvestido}
          stroke="var(--color-ink-muted)"
          strokeWidth={1}
          strokeDasharray="5 5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={linha}
          fill="none"
          stroke={cor}
          strokeWidth={2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <p className="mt-1 px-4 font-mono text-[10px] text-ink-muted">
        Linha tracejada: os {brl(investido)} aplicados. Acima dela, ganho;
        abaixo, perda.
      </p>
    </div>
  );
}
