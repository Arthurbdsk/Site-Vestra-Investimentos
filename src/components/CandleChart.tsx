"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useVisivel } from "@/lib/useVisivel";

type Candle = { o: number; c: number; h: number; l: number };

const seed: Candle[] = [
  { o: 42, c: 46, h: 48, l: 41 },
  { o: 46, c: 44, h: 47, l: 43 },
  { o: 44, c: 50, h: 52, l: 44 },
  { o: 50, c: 48, h: 51, l: 46 },
  { o: 48, c: 55, h: 57, l: 47 },
  { o: 55, c: 53, h: 56, l: 51 },
  { o: 53, c: 60, h: 62, l: 52 },
  { o: 60, c: 58, h: 61, l: 56 },
  { o: 58, c: 66, h: 68, l: 57 },
  { o: 66, c: 71, h: 74, l: 65 },
  { o: 71, c: 68, h: 72, l: 66 },
  { o: 68, c: 78, h: 80, l: 67 },
];

const W = 340;
const H = 190;
const step = W / seed.length;
const bodyW = step * 0.44;
const scale = (v: number) => H - (v / 90) * H;

/**
 * Gráfico de velas que entra desenhando e continua respirando: a última
 * vela oscila de leve, como um papel sendo negociado agora. A geometria
 * usa atributos SVG normais (framer-motion não anima y1/height de forma
 * confiável), então a transição fica por conta do CSS.
 */
export function CandleChart() {
  const [live, setLive] = useState(0);
  // O observador fica numa div em volta, e nao no proprio <svg>: medir
  // area visivel de SVG nao e confiavel.
  const { ref, visivel } = useVisivel<HTMLDivElement>();

  useEffect(() => {
    if (!visivel) return;
    const id = setInterval(() => setLive(Math.random() * 6 - 3), 1600);
    return () => clearInterval(id);
  }, [visivel]);

  const ultimoFechamento = seed[seed.length - 1].c + live;

  return (
    <div ref={ref}>
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

      {seed.map((c, i) => {
        const last = i === seed.length - 1;
        const close = last ? ultimoFechamento : c.c;
        const high = last ? Math.max(c.h, close + 1) : c.h;
        const low = last ? Math.min(c.l, close - 1) : c.l;
        const up = close >= c.o;
        const color = up ? "var(--color-alta)" : "var(--color-baixa)";
        const x = i * step + step / 2;
        const top = scale(Math.max(c.o, close));
        const height = Math.max(Math.abs(scale(c.o) - scale(close)), 2);

        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.35 + i * 0.055 }}
          >
            <line
              x1={x}
              x2={x}
              y1={scale(high)}
              y2={scale(low)}
              stroke={color}
              strokeWidth="1.4"
              opacity="0.75"
              style={{ transition: "all 0.7s ease-out" }}
            />
            <rect
              x={x - bodyW / 2}
              width={bodyW}
              y={top}
              height={height}
              fill={color}
              opacity={last ? 1 : 0.82}
              rx="1"
              style={{ transition: "all 0.7s ease-out" }}
            />
          </motion.g>
        );
      })}

      {/* O fade fica no <g>: framer-motion nao lida bem com y1/y2 de <line>. */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <line
          x1="0"
          x2={W}
          y1={scale(ultimoFechamento)}
          y2={scale(ultimoFechamento)}
          stroke="var(--color-gold)"
          strokeWidth="1"
          strokeDasharray="4 4"
          style={{ transition: "all 0.7s ease-out" }}
        />
      </motion.g>
    </svg>
    </div>
  );
}
