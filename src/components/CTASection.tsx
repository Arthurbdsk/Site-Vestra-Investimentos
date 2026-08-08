"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { MagneticButton } from "./MagneticButton";
import { TickerTape } from "./TickerTape";
import { TituloRevelado, Surge } from "./TituloRevelado";

export function CTASection() {
  return (
    <section className="grain relative overflow-hidden bg-blue">
      <Image
        src="/images/cta-skyline.jpg"
        alt=""
        fill
        aria-hidden="true"
        className="object-cover opacity-40 grayscale"
      />
      <div className="absolute inset-0 bg-blue/85" aria-hidden="true" />
      <TickerTape speed="slow" />

      <div
        className="halo left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 bg-gold/25"
        aria-hidden="true"
      />

      <div className="relative z-[2] mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="grid gap-10 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <div>
            <TituloRevelado
              linhas={["Sua primeira ação", "começa aqui."]}
              destaque={1}
              className="font-display text-[10vw] leading-[0.98] text-onblue sm:text-[6vw] md:text-[4.4rem]"
            />

            <Surge atraso={0.2} className="mt-9">
              <MagneticButton href="/simulador" variant="gold" className="group">
                Começar agora, é de graça
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </MagneticButton>
            </Surge>
          </div>

          <Surge atraso={0.3}>
            <p className="border-l-[3px] border-gold pl-5 text-sm leading-relaxed text-onblue-muted">
              Nenhuma promessa de ficar rico rápido. Só um lugar seguro pra
              você entender o mercado no seu ritmo, sem pressa e sem risco.
            </p>
          </Surge>
        </div>
      </div>
    </section>
  );
}
