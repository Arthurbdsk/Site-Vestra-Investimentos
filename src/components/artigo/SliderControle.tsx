/**
 * Controle deslizante (slider) usado nas calculadoras de artigo.
 *
 * Compartilhado entre CalculadoraJurosCompostos e ComparadorRendaFixa: os
 * dois tinham a mesma marcacao, so mudavam os valores passados por prop.
 */
export function SliderControle({
  rotulo,
  valor,
  min,
  max,
  passo,
  bruto,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  min: number;
  max: number;
  passo: number;
  bruto: number;
  aoMudar: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        {rotulo}
      </span>
      <span className="mt-1 block font-mono text-lg tabular text-ink">{valor}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={passo}
        value={bruto}
        onChange={(e) => aoMudar(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--color-azul-texto)]"
      />
    </label>
  );
}
