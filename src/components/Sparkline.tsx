"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { caminhoSuave } from "@/lib/svgPath";

type SparklineProps = {
  points: number[];
  positive?: boolean;
  delay?: number;
};

export function Sparkline({ points, positive = true, delay = 0 }: SparklineProps) {
  const gradId = useId();
  const width = 100;
  const height = 32;
  const pad = 3;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;

  const pontos = points.map((p, i) => ({
    x: (i / (points.length - 1)) * width,
    y: pad + (1 - (p - min) / range) * (height - pad * 2),
  }));

  const linha = caminhoSuave(pontos);
  const ultimo = pontos[pontos.length - 1];
  const area = `${linha} L${ultimo.x.toFixed(1)},${height} L${pontos[0].x.toFixed(1)},${height} Z`;

  const color = positive ? "#16a34a" : "#e11d48";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-8 w-24 overflow-visible">
      <defs>
        <linearGradient id={`spark-${gradId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.path
        d={area}
        fill={`url(#spark-${gradId})`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
      />

      <motion.path
        d={linha}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay, ease: "easeInOut" }}
      />

      <circle cx={ultimo.x} cy={ultimo.y} r="2.2" fill={color} />
    </svg>
  );
}
