"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Titulo que sobe linha por linha de dentro de uma mascara.
 *
 * IMPORTANTE: o gatilho (whileInView) fica no elemento de fora, que nunca
 * se move. Se ele ficasse na linha animada, a linha comecaria deslocada
 * pra fora da area visivel e esperaria por si mesma pra sempre, e o texto
 * nunca apareceria. Foi exatamente esse bug que quebrou a ultima secao.
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
      initial="oculto"
      whileInView="visivel"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        visivel: { transition: { staggerChildren: 0.09, delayChildren: atraso } },
      }}
    >
      <Tag className={className}>
        {linhas.map((linha, i) => {
          const eDestaque = i === destaque;
          const dourado = eDestaque && fundo === "escuro";
          const grifado = eDestaque && fundo === "claro";

          return (
            <span key={`${linha}-${i}`} className="block overflow-hidden pb-[0.12em]">
              <motion.span
                className={`relative inline-block ${eDestaque ? "italic" : ""} ${
                  dourado ? "text-gold" : ""
                }`}
                variants={{
                  oculto: { y: "110%" },
                  visivel: {
                    y: "0%",
                    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
              >
                {linha}
                {grifado && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-[0.06em] -z-10 h-[0.22em] origin-left bg-gold"
                    variants={{
                      oculto: { scaleX: 0 },
                      visivel: {
                        scaleX: 1,
                        transition: {
                          duration: 0.7,
                          delay: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        },
                      },
                    }}
                  />
                )}
              </motion.span>
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
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: atraso, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
