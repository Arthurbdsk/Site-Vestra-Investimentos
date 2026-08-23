"use client";

import { motion } from "framer-motion";

/**
 * Antes esta secao trazia um depoimento: frase inventada, foto de banco
 * de imagens e assinatura "Usuario do simulador Vestra". Depoimento
 * fabricado apresentado como real e propaganda enganosa (CDC art. 37),
 * e o estudo Spiegel/Northwestern mostra que UM depoimento e o pior
 * caso possivel: paga o custo de credibilidade sem atingir o limiar
 * que faz prova social funcionar (que fica perto de cinco).
 *
 * Trocado por um dado de terceiro neutro, verificado na fonte primaria.
 * Quando houver depoimentos reais (nome, contexto, autorizacao), eles
 * podem voltar (cinco, nao um).
 */
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            O tamanho do problema
          </p>

          <p className="mt-4 font-display text-[13vw] leading-[0.95] text-ink sm:text-[8vw] md:text-[5rem]">
            36%
          </p>

          <p className="mt-4 border-l-[3px] border-sky pl-5 text-xl leading-relaxed text-ink sm:text-2xl">
            É quanto da população brasileira tem algum investimento
            financeiro. A maioria não investe, e quase nunca é por falta de
            vontade.
          </p>

          <p className="mt-6 font-mono text-[11px] leading-relaxed text-ink-muted">
            Fonte: ANBIMA, Raio X do Investidor Brasileiro, 9ª edição, com
            dados de 2025.{" "}
            <a
              href="https://www.anbima.com.br/pt_br/especial/raio-x-do-investidor-brasileiro.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 transition-colors hover:text-blue"
            >
              Ver a pesquisa
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
