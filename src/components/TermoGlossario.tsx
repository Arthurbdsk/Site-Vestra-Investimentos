"use client";

import { useState } from "react";
import { termoPorNome } from "@/lib/glossario";

/**
 * Envolve um rotulo (ex: "P/L", "Beta") com um link pro Dicionario. Clique
 * em vez de so hover: metade de quem usa o simulador esta no celular, e
 * hover nao existe la.
 */
export function TermoGlossario({ termo, children }: { termo: string; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const definicao = termoPorNome(termo)?.definicao;

  if (!definicao) return <>{children}</>;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="border-b border-dotted border-ink-muted text-left outline-none"
        aria-expanded={aberto}
      >
        {children}
      </button>
      {aberto && (
        <>
          <span
            className="fixed inset-0 z-[90]"
            onClick={() => setAberto(false)}
            aria-hidden="true"
          />
          <span className="absolute left-0 top-full z-[91] mt-2 w-56 border border-[var(--rule)] bg-paper p-3 text-xs font-body normal-case leading-relaxed tracking-normal text-ink shadow-lg">
            {definicao}
          </span>
        </>
      )}
    </span>
  );
}
