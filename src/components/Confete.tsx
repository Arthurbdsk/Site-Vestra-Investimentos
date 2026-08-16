"use client";

import { motion } from "framer-motion";

const CORES = ["var(--color-gold)", "var(--color-blue)", "#4fc7b3", "#e11d48", "var(--color-gold-soft)"];

/**
 * Confete leve (sem lib externa): uma penca de retangulos que explode
 * do centro e cai, uma vez, ao montar. Puramente decorativo, usado nos
 * momentos de "recompensa" (subir de nivel, desbloquear uma funcao).
 */
export function Confete({ quantidade = 24 }: { quantidade?: number }) {
  const pedacos = Array.from({ length: quantidade }, (_, i) => {
    const angulo = (i / quantidade) * Math.PI * 2 + Math.random() * 0.5;
    const distancia = 80 + Math.random() * 90;
    return {
      id: i,
      cor: CORES[i % CORES.length],
      x: Math.cos(angulo) * distancia,
      y: Math.sin(angulo) * distancia * 0.6 - 20,
      rot: Math.random() * 360,
      delay: Math.random() * 0.15,
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pedacos.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.x, y: p.y + 140, opacity: 0, rotate: p.rot, scale: 0.6 }}
          transition={{ duration: 1.1, delay: p.delay, ease: "easeOut" }}
          className="absolute left-1/2 top-1/3 h-2.5 w-1.5"
          style={{ background: p.cor }}
        />
      ))}
    </div>
  );
}
