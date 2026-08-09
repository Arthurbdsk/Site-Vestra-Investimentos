"use client";

import { motion } from "framer-motion";
import { TituloRevelado, Surge } from "./TituloRevelado";

const principios = [
  {
    titulo: "Conhecimento não pode ter porteiro",
    texto:
      "Se você precisar de um dicionário pra entender a gente, o erro é nosso. Aqui se fala português.",
    cor: "var(--color-teal)",
  },
  {
    titulo: "Errar aqui não custa nada",
    texto:
      "Você treina com dinheiro fictício. O erro vira aprendizado em vez de virar prejuízo.",
    cor: "var(--color-coral)",
  },
  {
    titulo: "Começar pequeno já é começar",
    texto:
      "Ninguém precisa esperar sobrar muito. O que muda um futuro é a constância, não o tamanho do primeiro passo.",
    cor: "var(--color-violet)",
  },
  {
    titulo: "A gente não vende sonho",
    texto:
      "Sem fórmula secreta, sem promessa de ficar rico rápido. Só o que é real, dito de forma clara.",
    cor: "var(--color-sky)",
  },
];

export function Valores() {
  return (
    <section className="grain relative overflow-hidden bg-paper-alt py-24 md:py-36">
      <div className="relative z-[2] mx-auto max-w-6xl px-6">
        <div className="grid gap-14 md:grid-cols-[0.85fr_1.15fr] md:gap-20">
          {/* Missao, fica parada enquanto os principios passam */}
          <div className="md:sticky md:top-28 md:self-start">
            <Surge>
              <span className="bg-teal px-2 py-1 font-mono text-[11px] font-semibold text-onblue">
                02
              </span>
            </Surge>

            <TituloRevelado
              linhas={["Por que a", "Vestra existe."]}
              atraso={0.1}
              className="mt-8 font-display text-4xl leading-[1.02] text-ink sm:text-5xl"
            />

            <Surge atraso={0.15}>
              <p className="mt-7 border-l-[3px] border-gold pl-5 text-lg leading-relaxed text-ink-muted">
                Pra colocar na mão de qualquer pessoa o conhecimento e as
                ferramentas que quase sempre ficam guardados com quem já tem
                dinheiro. Porque uma decisão simples, tomada cedo, muda o resto
                de uma vida.
              </p>
            </Surge>
          </div>

          {/* Principios */}
          <ul className="border-t border-[var(--rule)]">
            {principios.map((p, i) => (
              <motion.li
                key={p.titulo}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{
                  duration: 0.65,
                  delay: i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="grupo border-b border-[var(--rule)] py-8 transition-colors hover:bg-paper"
              >
                <div className="flex gap-6">
                  <span
                    className="mt-1 font-mono text-xs tabular font-semibold"
                    style={{ color: p.cor }}
                  >
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl leading-snug text-ink sm:text-[1.75rem]">
                      <span className="sublinhado">{p.titulo}</span>
                    </h3>
                    <p className="mt-3 max-w-md leading-relaxed text-ink-muted">
                      {p.texto}
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
