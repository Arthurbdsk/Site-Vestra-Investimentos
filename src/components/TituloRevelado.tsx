"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Titulo de secao. Antes cada linha subia de dentro de uma mascara e a
 * linha de destaque vinha em italico: isso em toda secao da home virava
 * ruido. Agora o titulo entra uma vez, com o mesmo fade curto do Surge,
 * e o destaque e so cor (dourado sobre azul) ou o grifo (sobre claro).
 *
 * O gatilho (whileInView) continua no elemento de fora, que nunca se
 * move, pelo mesmo motivo de antes: um elemento deslocado pra fora da
 * area visivel esperaria por si mesmo pra sempre.
 */
export function TituloRevelado({
  linhas,
  className = "",
  destaque,
  como: Tag = "h2",
  atraso = 0,
  fundo = "escuro",
}: {
  linhas: string[];
  className?: string;
  /** Indice da linha destacada. */
  destaque?: number;
  como?: "h1" | "h2";
  atraso?: number;
  /**
   * Onde o titulo esta apoiado. Dourado sobre claro tem contraste de 2:1,
   * praticamente ilegivel, entao em fundo claro o destaque vira texto
   * normal com um grifo dourado por baixo.
   */
  fundo?: "escuro" | "claro";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: atraso, ease: [0.22, 1, 0.36, 1] }}
    >
      <Tag className={`isolate ${className}`}>
        {linhas.map((linha, i) => {
          const eDestaque = i === destaque;
          const dourado = eDestaque && fundo === "escuro";
          const grifado = eDestaque && fundo === "claro";

          return (
            <span key={`${linha}-${i}`} className="block pb-[0.08em]">
              <span className={`relative inline-block ${dourado ? "text-gold" : ""}`}>
                {linha}
                {grifado && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-[0.06em] -z-10 h-[0.22em] bg-gold"
                  />
                )}
              </span>
            </span>
          );
        })}
      </Tag>
    </motion.div>
  );
}

/** Aparece subindo de leve. Seguro: nao depende da propria posicao. */
export function Surge({
  children,
  atraso = 0,
  className = "",
}: {
  children: ReactNode;
  atraso?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: atraso, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
