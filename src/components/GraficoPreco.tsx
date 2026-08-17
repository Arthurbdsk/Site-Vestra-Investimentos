"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import type { PontoSerie } from "@/lib/historico";
import { caminhoSuave } from "@/lib/svgPath";
import { data as fmtData, dataHora, brl } from "@/lib/formato";

const W = 640;
const H = 260;
const PAD_X = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 34;

export function GraficoPreco({ serie }: { serie: PontoSerie[] }) {
  const gradId = useId();
  if (serie.length < 2) return null;

  const precos = serie.map((p) => p.preco);
  const max = Math.max(...precos);
  const min = Math.min(...precos);
  const range = max - min || 1;
  // Um respiro acima/abaixo pra linha nao colar no teto/chao do grafico.
  const folga = range * 0.12;
  const escalaMax = max + folga;
  const escalaMin = min - folga;
  const escalaRange = escalaMax - escalaMin || 1;

  const subiu = precos[precos.length - 1] >= precos[0];
  const cor = subiu ? "var(--color-azul-texto)" : "#e11d48";

  const alturaUtil = H - PAD_TOP - PAD_BOTTOM;
  const pontos = serie.map((p, i) => ({
    x: PAD_X + (i / (serie.length - 1)) * (W - PAD_X * 2),
    y: PAD_TOP + (1 - (p.preco - escalaMin) / escalaRange) * alturaUtil,
  }));

  const linha = caminhoSuave(pontos);
  const ultimo = pontos[pontos.length - 1];
  const area = `${linha} L${ultimo.x.toFixed(2)},${PAD_TOP + alturaUtil} L${pontos[0].x.toFixed(2)},${PAD_TOP + alturaUtil} Z`;

  // Serie intraday (varios pontos no mesmo dia) mostra hora, nao so a data.
  const mesmoDia =
    new Date(serie[0].data).toDateString() ===
    new Date(serie[serie.length - 1].data).toDateString();
  const fmt = mesmoDia ? dataHora : fmtData;

  const linhasGuia = [escalaMax, (escalaMax + escalaMin) / 2, escalaMin];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`grad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={cor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {linhasGuia.map((valor, i) => {
          const y = PAD_TOP + (1 - (valor - escalaMin) / escalaRange) * alturaUtil;
          return (
            <g key={i}>
              <line
                x1={PAD_X}
                x2={W - PAD_X}
                y1={y}
                y2={y}
                stroke="var(--rule)"
                strokeDasharray="3 5"
              />
              <text
                x={W - PAD_X}
                y={y - 5}
                textAnchor="end"
                className="font-mono"
                fontSize="11"
                fill="var(--color-ink-muted)"
              >
                {brl(valor)}
              </text>
            </g>
          );
        })}

        <motion.path
          d={area}
          fill={`url(#grad-${gradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />

        <motion.path
          d={linha}
          fill="none"
          stroke={cor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />

        <motion.circle
          cx={ultimo.x}
          cy={ultimo.y}
          r="5"
          fill={cor}
          stroke="var(--color-paper)"
          strokeWidth="2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 1 }}
        />
        <motion.circle
          cx={ultimo.x}
          cy={ultimo.y}
          r="5"
          fill="none"
          stroke={cor}
          strokeWidth="1.5"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 2.4 }}
          transition={{ duration: 1.6, delay: 1.2, repeat: Infinity, repeatDelay: 0.6 }}
        />
      </svg>

      <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-ink-muted">
        <span>
          {fmt(serie[0].data)} · {brl(serie[0].preco)}
        </span>
        <span>
          {fmt(serie[serie.length - 1].data)} · {brl(serie[serie.length - 1].preco)}
        </span>
      </div>
    </div>
  );
}
