"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function Depoimento() {
  return (
    <section className="grain relative bg-paper py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 flex items-center gap-4">
          <span className="bg-sky px-2 py-1 font-mono text-[11px] font-semibold text-onblue">
            05
          </span>
          <span className="h-px flex-1 bg-[var(--rule)]" />
        </div>

        <motion.figure
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-start gap-6 sm:flex-row sm:items-center"
        >
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-sky">
            <Image
              src="/images/depoimento-avatar.jpg"
              alt=""
              width={128}
              height={128}
              className="h-full w-full object-cover"
            />
          </div>

          <blockquote className="border-l-[3px] border-sky pl-5">
            <p className="font-display text-xl leading-relaxed text-ink sm:text-2xl">
              &ldquo;Testei umas três semanas antes de colocar dinheiro de
              verdade. Foi a primeira vez que uma carteira de ações fez
              sentido pra mim.&rdquo;
            </p>
            <figcaption className="mt-4 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
              Usuário do simulador Vestra
            </figcaption>
          </blockquote>
        </motion.figure>
      </div>
    </section>
  );
}
