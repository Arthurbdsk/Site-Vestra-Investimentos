"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { MagneticButton } from "./MagneticButton";
import { TickerTape } from "./TickerTape";

export function CTASection() {
  return (
    <section className="grain relative overflow-hidden bg-blue">
      <TickerTape speed="slow" />
      <div className="ruled-inv absolute inset-0 opacity-50" aria-hidden="true" />

      <div className="relative z-[2] mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="grid gap-10 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <div>
            <h2 className="font-display text-[10vw] leading-[0.95] text-onblue sm:text-[6vw] md:text-[4.4rem]">
              <span className="block overflow-hidden">
                <motion.span
                  initial={{ y: "108%" }}
                  whileInView={{ y: "0%" }}
                  viewport={{ once: true, margin: "-70px" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block"
                >
                  Sua primeira ação
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  initial={{ y: "108%" }}
                  whileInView={{ y: "0%" }}
                  viewport={{ once: true, margin: "-70px" }}
                  transition={{
                    duration: 0.8,
                    delay: 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-block italic text-gold"
                >
                  começa aqui.
                </motion.span>
              </span>
            </h2>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-9"
            >
              <MagneticButton href="/simulador" variant="gold" className="group">
                Começar agora, é de graça
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </MagneticButton>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="border-l-[3px] border-gold pl-5 text-sm leading-relaxed text-onblue-muted"
          >
            Nenhuma promessa de ficar rico rápido. Só um lugar seguro pra
            você entender o mercado no seu ritmo, sem pressa e sem risco.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
