"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";

const texto =
  "A maioria dos cursos de investimento fala uma língua que ninguém te ensinou primeiro. Termo técnico em cima de termo técnico, gráfico cheio de número, e aquele medinho de clicar no botão errado e perder dinheiro de verdade. Aqui é diferente: você mexe numa carteira com ações reais da bolsa brasileira, só que o dinheiro é fictício. Pode errar à vontade.";

/** Cada palavra escurece conforme a seção passa pela tela. */
function Palavra({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <motion.span style={{ opacity }} className="mr-[0.28em] inline-block">
      {children}
    </motion.span>
  );
}

export function WhySection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.2"],
  });

  const palavras = texto.split(" ");

  return (
    <section className="grain relative bg-paper py-24 md:py-36">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 flex items-center gap-4">
          <span className="bg-gold px-2 py-1 font-mono text-[11px] font-semibold text-blue">
            01
          </span>
          <span className="h-px flex-1 bg-[var(--rule)]" />
        </div>

        <div ref={ref}>
          <p className="font-display text-2xl leading-[1.45] text-ink sm:text-3xl md:text-[2.6rem] md:leading-[1.35]">
            {palavras.map((p, i) => {
              const start = i / palavras.length;
              const end = (i + 1) / palavras.length;
              return (
                <Palavra
                  key={`${p}-${i}`}
                  progress={scrollYProgress}
                  range={[start, end]}
                >
                  {p}
                </Palavra>
              );
            })}
          </p>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="mt-14 max-w-xl border-l-[3px] border-gold pl-5 text-base leading-relaxed text-ink-muted"
        >
          A ideia não é te transformar em trader da noite pro dia. É te dar
          confiança pra entender o que acontece com o seu dinheiro, seja o
          fictício daqui ou o de verdade lá fora.
        </motion.p>
      </div>
    </section>
  );
}
