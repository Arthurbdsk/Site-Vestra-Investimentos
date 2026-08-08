"use client";

import { motion } from "framer-motion";
import type { PontoSerie } from "@/lib/historico";
import { data as fmtData, brl } from "@/lib/formato";

const W = 640;
const H = 220;
const PAD = 8;

export function GraficoPreco({ serie }: { serie: PontoSerie[] }) {
  if (serie.length < 2) return null;

  const precos = serie.map((p) => p.preco);
  const max = Math.max(...precos);
  const min = Math.min(...precos);
  const range = max - min || 1;
  const subiu = precos[precos.length - 1] >= precos[0];
  const cor = subiu ? "var(--color-blue)" : "#e11d48";

  const pontos = serie.map((p, i) => {
    const x = PAD + (i / (serie.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (p.preco - min) / range) * (H - PAD * 2);
    return { x, y };
  });

  const linha = pontos
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const area = `${linha} L${pontos[pontos.length - 1].x.toFixed(1)},${H - PAD} L${pontos[0].x.toFixed(1)},${H - PAD} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1="0"
            x2={W}
            y1={H * g}
            y2={H * g}
            stroke="var(--rule)"
            strokeDasharray="3 5"
          />
        ))}

        <defs>
          <linearGradient id="grad-preco" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={cor} stopOpacity="0" />
          </linearGradient>
        </defs>

        <motion.path
          d={area}
          fill="url(#grad-preco)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />

        <motion.path
          d={linha}
          fill="none"
          stroke={cor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        />
      </svg>

      <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-ink-muted">
        <span>
          {fmtData(serie[0].data)} · {brl(serie[0].preco)}
        </span>
        <span>
          {fmtData(serie[serie.length - 1].data)} ·{" "}
          {brl(serie[serie.length - 1].preco)}
        </span>
      </div>
    </div>
  );
}
