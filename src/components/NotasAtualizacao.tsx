import { NOTAS_ATUALIZACAO } from "@/lib/changelog";
import { data as fmtData } from "@/lib/formato";

export function NotasAtualizacao() {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Novidades</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        O que mudou no Vestra recentemente, mais recente primeiro.
      </p>

      <ol className="mt-8 border-l border-[var(--rule)]">
        {NOTAS_ATUALIZACAO.map((nota, i) => (
          <li key={i} className="relative pb-8 pl-6 last:pb-0">
            <span
              className="absolute left-0 top-1.5 h-2 w-2 -translate-x-1/2 rounded-full bg-blue"
              aria-hidden
            />
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
              {fmtData(nota.data)}
            </p>
            <h3 className="mt-1.5 font-display text-lg text-ink">{nota.titulo}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              {nota.descricao}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
